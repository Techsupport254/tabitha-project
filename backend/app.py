"""
Main application module for the AI-Assisted Medicine Prescription System.
This module integrates all components and provides the main interface.
"""

import logging
from pathlib import Path
from typing import Dict, List, Optional, Tuple, Any
from datetime import datetime, date, timedelta
from flask import Flask, jsonify, request, send_from_directory, session, current_app
from flask_cors import CORS
import os
import re
import uuid
import json
import mysql.connector
from mysql.connector import Error
from dotenv import load_dotenv
import time
from functools import wraps
import pandas as pd
import numpy as np
import traceback

from medication_recommender import MedicationRecommender
from patient_history import PatientHistoryManager
from inventory_manager import InventoryManager
from security_manager import SecurityManager
from data_sync import DataSyncManager
from disease_predictor import DiseasePredictor
from test_model import DiseasePredictorTester
from symptom_synonyms import symptom_synonyms

# Constants for confidence thresholds
MIN_DISEASE_CONFIDENCE = 0.1  # Minimum confidence percentage for disease predictions
MAX_SYMPTOMS = 10  # Maximum number of symptoms to consider
TOP_N_DISEASES = 3  # Only show the top 3 predictions

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()
logger.info("Environment variables loaded:")
logger.info(f"FLASK_SECRET_KEY: {'Set' if os.getenv('FLASK_SECRET_KEY') else 'Not set'}")
logger.info(f"FLASK_ENV: {os.getenv('FLASK_ENV', 'development')}")
logger.info(f"FLASK_DEBUG: {os.getenv('FLASK_DEBUG', '1')}")
logger.info(f"MYSQL_DATABASE_HOST: {os.getenv('MYSQL_DATABASE_HOST', 'Not set')}")
logger.info(f"MYSQL_DATABASE_USER: {os.getenv('MYSQL_DATABASE_USER', 'Not set')}")
logger.info(f"MYSQL_DATABASE_DB: {os.getenv('MYSQL_DATABASE_DB', 'Not set')}")

# Define role-based access control
ROLE_PERMISSIONS = {
    'admin': ['*'],  # Admin has all permissions
    'pharmacist': [
        'view_inventory',
        'edit_inventory',
        'view_prescriptions',
        'approve_prescriptions',
        'view_analytics',
        'view_patients'
    ],
    'doctor': [
        'view_inventory',
        'view_prescriptions',
        'create_prescriptions',
        'approve_prescriptions',
        'view_analytics',
        'view_patients'
    ],
    'patient': [
        'view_prescriptions',
        'view_own_profile',
        'create_prescriptions'  # Allow patients to create prescriptions through the system
    ],
    'system': [  # Add system role with all necessary permissions
        'view_inventory',
        'view_prescriptions',
        'create_prescriptions',
        'approve_prescriptions',
        'view_analytics',
        'view_patients'
    ]
}

def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return jsonify({'error': 'Authentication required'}), 401
        return f(*args, **kwargs)
    return decorated_function

def role_required(allowed_roles):
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            if 'user_id' not in session:
                return jsonify({'error': 'Authentication required'}), 401
            
            user_role = session.get('role')
            if not user_role or user_role not in allowed_roles:
                return jsonify({'error': 'Insufficient permissions'}), 403
                
            return f(*args, **kwargs)
        return decorated_function
    return decorator

def permission_required(required_permission):
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            if 'user_id' not in session:
                return jsonify({'error': 'Authentication required'}), 401
                
            user_role = session.get('role')
            if not user_role:
                return jsonify({'error': 'Role not found'}), 403
                
            # Admin has all permissions
            if user_role == 'admin':
                return f(*args, **kwargs)
                
            # Check if user's role has the required permission
            role_permissions = ROLE_PERMISSIONS.get(user_role, [])
            if required_permission not in role_permissions:
                return jsonify({'error': 'Insufficient permissions'}), 403
                
            return f(*args, **kwargs)
        return decorated_function
    return decorator

class DatabaseManager:
    def __init__(self):
        """Initialize database connection."""
        self.conn = None
        self._pool = None
        self._last_test_time = 0
        self._test_interval = 30  # Test connection every 30 seconds
        self._pool_size = 20  # Increased pool size from 10 to 20
        self._pool_timeout = 30  # Connection timeout in seconds
        self._user_cache = {}  # Cache for user data
        self._cache_ttl = 300  # Cache TTL in seconds (5 minutes)
        self._initialize_pool()

    def _initialize_pool(self):
        """Initialize the connection pool."""
        try:
            # Close existing pool if it exists
            if self._pool:
                try:
                    self._pool.close()
                except:
                    pass
                self._pool = None

            # Create connection pool with increased size and timeout
            self._pool = mysql.connector.pooling.MySQLConnectionPool(
                pool_name="mypool",
                pool_size=self._pool_size,
                host=os.getenv('MYSQL_DATABASE_HOST', 'localhost'),
                user=os.getenv('MYSQL_DATABASE_USER', 'root'),
                password=os.getenv('MYSQL_DATABASE_PASSWORD', ''),
                database=os.getenv('MYSQL_DATABASE_DB', 'tabitha'),
                connect_timeout=self._pool_timeout,
                use_pure=True,
                autocommit=True,
                pool_reset_session=True,
                get_warnings=True,
                raise_on_warnings=True,
                connection_timeout=self._pool_timeout,
                buffered=True
            )
            logger.info(f"Database connection pool initialized successfully with size {self._pool_size}")
        except Error as e:
            logger.error(f"Error creating database connection pool: {e}")
            self._pool = None
            raise

    def _test_connection(self, conn):
        """Test if a connection is still valid."""
        try:
            cursor = conn.cursor()
            cursor.execute("SELECT 1")
            cursor.close()
            return True
        except Error:
            return False

    def _get_connection(self):
        """Get a connection from the pool with periodic testing and proper cleanup."""
        conn = None
        try:
            if not self._pool:
                logger.info("Connection pool not available. Reinitializing...")
                self._initialize_pool()
            
            # Get connection from pool with timeout
            conn = self._pool.get_connection()
            
            # Test connection periodically
            current_time = time.time()
            if current_time - self._last_test_time > self._test_interval:
                if not self._test_connection(conn):
                    logger.warning("Connection test failed. Reinitializing pool...")
                    try:
                        conn.close()
                    except:
                        pass
                    self._initialize_pool()
                    conn = self._pool.get_connection()
                self._last_test_time = current_time
            
            return conn
        except Error as e:
            if conn:
                try:
                    conn.close()
                except:
                    pass
            logger.error(f"Error getting database connection: {e}")
            # If pool is exhausted, try to reinitialize
            if "pool exhausted" in str(e).lower():
                logger.warning("Connection pool exhausted. Attempting to reinitialize...")
                self._initialize_pool()
                try:
                    return self._pool.get_connection()
                except Error as retry_e:
                    logger.error(f"Failed to get connection after pool reinitialization: {retry_e}")
                    raise
            raise

    def execute_query(self, query, params=None, fetch=True, dictionary=True):
        """Execute a query with proper connection handling."""
        conn = None
        cursor = None
        try:
            conn = self._get_connection()
            cursor = conn.cursor(dictionary=dictionary, buffered=True)
            cursor.execute(query, params or ())
            
            if fetch:
                result = cursor.fetchall()
            else:
                conn.commit()
                result = cursor.rowcount
                
            return result
        except Error as e:
            if conn:
                try:
                    conn.rollback()
                except:
                    pass
            raise
        finally:
            if cursor:
                try:
                    cursor.close()
                except:
                    pass
            if conn:
                try:
                    conn.close()
                except:
                    pass

    def get_user_by_email(self, email: str) -> Optional[Dict]:
        """Get user by email."""
        cursor = None
        try:
            conn = self._get_connection()
            cursor = conn.cursor(dictionary=True)
            cursor.execute("SELECT * FROM users WHERE email = %s", (email,))
            return cursor.fetchone()
        except Error as e:
            logger.error(f"Error getting user by email: {e}")
            return None
        finally:
            if cursor:
                try:
                    cursor.close()
                except:
                    pass

    def get_user_by_id(self, user_id: str) -> Optional[Dict]:
        """Get user by ID with caching."""
        # Check cache first
        cache_key = f"user_{user_id}"
        if cache_key in self._user_cache:
            cache_entry = self._user_cache[cache_key]
            if time.time() - cache_entry['timestamp'] < self._cache_ttl:
                return cache_entry['data']

        cursor = None
        try:
            conn = self._get_connection()
            cursor = conn.cursor(dictionary=True)
            cursor.execute("SELECT id, name, email, role, dob, gender FROM users WHERE id = %s", (user_id,))
            user = cursor.fetchone()
            if user and user.get('dob'):
                if isinstance(user['dob'], date):
                    user['dob'] = user['dob'].strftime('%Y-%m-%d')
            
            # Update cache
            if user:
                self._user_cache[cache_key] = {
                    'data': user,
                    'timestamp': time.time()
                }
            return user
        except Error as e:
            logger.error(f"Error getting user by ID: {e}")
            return None
        finally:
            if cursor:
                try:
                    cursor.close()
                except:
                    pass

    def create_user(self, user_id: str, email: str, password: str, name: str, role: str, dob: str, gender: str) -> bool:
        """Create a new user."""
        cursor = None
        conn = None
        try:
            conn = self._get_connection()
            cursor = conn.cursor()
            query = """
                INSERT INTO users (id, email, password, name, role, dob, gender, created_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s, NOW())
            """
            cursor.execute(query, (user_id, email, password, name, role, dob, gender))
            conn.commit()
            return True
        except Error as e:
            logger.error(f"Error creating user: {e}")
            if conn:
                try:
                    conn.rollback()
                except Error:
                    pass
            return False
        finally:
            if cursor:
                try:
                    cursor.close()
                except:
                    pass

    def close(self):
        """Close the database connection pool."""
        try:
            if self._pool:
                self._pool.close()
                logger.info("Database connection pool closed")
        except Error as e:
            logger.error(f"Error closing database pool: {e}")
        finally:
            self._pool = None
            self.conn = None

    def clear_user_cache(self, user_id: str = None):
        """Clear user cache for a specific user or all users."""
        if user_id:
            cache_key = f"user_{user_id}"
            self._user_cache.pop(cache_key, None)
        else:
            self._user_cache.clear()

    def delete_user(self, user_id: str) -> bool:
        """Delete a user from the database."""
        cursor = None
        conn = None
        try:
            conn = self._get_connection()
            cursor = conn.cursor()
            
            # Delete user
            cursor.execute("DELETE FROM users WHERE id = %s", (user_id,))
            conn.commit()
            
            # Clear user cache
            self.clear_user_cache(user_id)
            
            return True
        except Error as e:
            logger.error(f"Error deleting user: {e}")
            if conn:
                try:
                    conn.rollback()
                except Error:
                    pass
            return False
        finally:
            if cursor:
                try:
                    cursor.close()
                except:
                    pass

# Initialize Flask app
app = Flask(__name__, static_folder='static', template_folder='templates')
app.secret_key = os.getenv('FLASK_SECRET_KEY', 'dev-secret-key')  # Use environment variable or fallback
logger.info(f"Flask secret key loaded: {app.secret_key is not None}") # Log if key is loaded
logger.info(f"Flask secret key value: {app.secret_key[:10]}...") # Log first 10 chars of key for debugging
app.config['ENV'] = os.getenv('FLASK_ENV', 'development')
app.config['DEBUG'] = os.getenv('FLASK_DEBUG', '1') == '1'

# CORS configuration
CORS(app, 
     supports_credentials=True, 
     origins=['http://localhost:3000', 'http://127.0.0.1:3000'],
     allow_headers=['Content-Type', 'Authorization'],
     expose_headers=['Content-Type', 'Authorization', 'Set-Cookie'],
     methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
     max_age=600)  # Cache preflight requests for 10 minutes

# Cookie configuration
app.config['SESSION_COOKIE_SECURE'] = True  # Set to True for SameSite=None
app.config['SESSION_COOKIE_HTTPONLY'] = True
app.config['SESSION_COOKIE_SAMESITE'] = 'None'  # Required for cross-origin requests
app.config['SESSION_COOKIE_DOMAIN'] = None
app.config['PERMANENT_SESSION_LIFETIME'] = 86400  # 24 hours in seconds
app.config['SESSION_COOKIE_PATH'] = '/'
app.config['SESSION_REFRESH_EACH_REQUEST'] = True

# Initialize prescription system and database
prescription_system = None
db_manager = None

def initialize_system():
    """Initialize the system components."""
    global prescription_system, db_manager
    try:
        db_manager = DatabaseManager()
        prescription_system = PrescriptionSystem(db_manager=db_manager, data_dir="data/processed")  # Pass db_manager to PrescriptionSystem
        logger.info("System initialized successfully")
    except Exception as e:
        logger.error(f"Error initializing system: {e}")
        raise

@app.before_request
def before_request():
    """Run before each request to ensure system is initialized."""
    global prescription_system, db_manager
    
    # Initialize system if not already done
    if not prescription_system or not db_manager:
        initialize_system()
        
    # Log request details
    logger.info(f"Incoming request: {request.method} {request.path}")
    logger.info(f"Request headers: {request.headers}")

def log_request_user(endpoint_name: str):
    user_id = session.get('user_id')
    user_role = session.get('role')
    if user_id:
        if isinstance(user_id, str) and '@' in user_id:
            logger.warning(f"[SECURITY] user_id looks like an email in session for endpoint {endpoint_name}: {user_id}")
        logger.info(f"[{endpoint_name}] Request made by user_id: {user_id}, role: {user_role}")
    else:
        logger.info(f"[{endpoint_name}] Request made by anonymous user")

@app.route('/')
def index():
    """Serve the main React application."""
    return send_from_directory(app.static_folder, 'index.html')

def extract_symptoms_from_description(description: str):
    """Extract symptoms from a free-text description using the symptom_synonyms dictionary."""
    detected = set()
    text = description.lower()
    
    # First pass: look for exact matches with word boundaries
    for canonical, synonyms in symptom_synonyms.items():
        for synonym in synonyms:
            if re.search(r'\b' + re.escape(synonym.lower()) + r'\b', text):
                detected.add(canonical)
                break
    
    # If we have too many symptoms, prioritize the most specific ones
    if len(detected) > MAX_SYMPTOMS:
        # Sort symptoms by length (longer phrases are usually more specific)
        sorted_symptoms = sorted(detected, key=len, reverse=True)
        detected = set(sorted_symptoms[:MAX_SYMPTOMS])
    
    return list(detected)

def filter_medications_by_history(meds, patient_history):
    """Filter out medications that are contraindicated or contain allergens for the patient."""
    if not patient_history:
        return meds
    allergies = set(a.lower() for a in patient_history.get('allergies', []))
    conditions = set(c.lower() for c in patient_history.get('medical_history', []))
    filtered = []
    for med in meds:
        # Check for allergy
        med_name = med.get('name', '').lower()
        med_generic = med.get('generic_name', '').lower()
        if any(allergy in med_name or allergy in med_generic for allergy in allergies):
            continue
        # Check for contraindications
        contraindications = [c.lower() for c in med.get('contraindications', [])]
        if any(cond in conditions for cond in contraindications):
            continue
        filtered.append(med)
    return filtered

@app.route('/api/symptoms', methods=['POST'])
@login_required
def analyze_symptoms():
    """Analyze symptoms and provide disease predictions with medication recommendations."""
    log_request_user('analyze_symptoms')
    logger.info(f"[analyze_symptoms] Request made by user_id: {session.get('user_id')}, role: {session.get('role')}")
    
    try:
        # Ensure system is initialized
        if not prescription_system or not db_manager:
            initialize_system()
            
        # Get patient info from session
        patient_id = session.get('user_id')
        if not patient_id:
            return jsonify({'error': 'User not authenticated'}), 401
            
        # Get request data
        data = request.get_json()
        if not data or 'description' not in data:
            return jsonify({'error': 'No symptom description provided'}), 400
            
        # Process symptoms using NLP
        symptoms = extract_symptoms_from_description(data['description'])
        if not symptoms:
            return jsonify({'error': 'No symptoms detected in the description'}), 400
            
        # Get a fresh database connection and cursor
        conn = db_manager._get_connection()
        cursor = conn.cursor(dictionary=True)
        
        try:
            # Add symptom history
            query = """
                INSERT INTO symptom_history 
                (patient_id, symptoms, severity)
                VALUES (%s, %s, %s)
            """
            cursor.execute(query, (patient_id, json.dumps(symptoms), 'moderate'))
            conn.commit()
            logger.info(f"Added symptom history for patient ID: {patient_id}")
            
            # Get predictions using the disease predictor
            predictor = DiseasePredictorTester(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'model', 'disease_predictor.pkl'))
            predictor.load_model()
            detected_symptoms, predictions = predictor.predict_from_text(' '.join(symptoms))
            
            # Filter predictions by confidence threshold and take top N
            filtered_preds = [(d, conf) for d, conf in predictions if conf >= MIN_DISEASE_CONFIDENCE]
            filtered_preds = filtered_preds[:TOP_N_DISEASES]
            
            # Generate recommendations
            recommendations = []
            for disease, confidence in filtered_preds:
                meds = prescription_system.medication_recommender.get_medication_recommendations(disease)
                
                # Create prescriptions using system role
                if meds:
                    for med in meds:
                        try:
                            # Create prescription using system role
                            prescription = {
                                'medication': med.get('brand_name', med.get('name', 'Unknown')),
                                'generic_name': med.get('generic_name', med.get('brand_name', med.get('name', 'Unknown'))),
                                'dosage': med.get('dosage', 'As prescribed'),
                                'frequency': 'As needed',
                                'status': 'pending',
                                'prescribed_by': '5838be12-3b2b-40a3-8883-8f00b46fa2c7'  # System doctor ID
                            }
                            
                            # Temporarily set session role to system for prescription creation
                            original_role = session.get('role')
                            session['role'] = 'system'
                            
                            # Insert prescription directly using cursor
                            prescription_id = str(uuid.uuid4())
                            med_query = "SELECT id FROM medications WHERE name = %s"
                            cursor.execute(med_query, (prescription['medication'],))
                            med_result = cursor.fetchone()
                            
                            if not med_result:
                                # Create medication if it doesn't exist
                                med_insert = """
                                    INSERT INTO medications (name, generic_name, dosage, description)
                                    VALUES (%s, %s, %s, %s)
                                """
                                cursor.execute(med_insert, (
                                    prescription['medication'],
                                    prescription.get('generic_name', prescription['medication']),
                                    prescription.get('dosage', ''),
                                    prescription.get('description', '')
                                ))
                                med_id = cursor.lastrowid
                            else:
                                med_id = med_result['id']
                            
                            # Insert prescription
                            presc_query = """
                                INSERT INTO prescriptions 
                                (id, patient_id, medication_id, prescribed_by, dosage, frequency, 
                                start_date, end_date, status, generic_name, notes)
                                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                            """
                            cursor.execute(presc_query, (
                                prescription_id,
                                patient_id,
                                med_id,
                                prescription['prescribed_by'],
                                prescription['dosage'],
                                prescription['frequency'],
                                datetime.now().date(),
                                None,
                                prescription['status'],
                                prescription.get('generic_name', prescription['medication']),
                                prescription.get('notes', '')
                            ))
                            conn.commit()
                            
                            # Restore original role
                            session['role'] = original_role
                            
                            recommendations.append({
                                'disease': disease,
                                'confidence': confidence,
                                'medication': med['name'],
                                'dosage': med.get('dosage', 'As prescribed'),
                                'frequency': 'As needed',
                                'status': 'pending'
                            })
                            
                        except Exception as e:
                            logger.error(f"Error creating prescription: {str(e)}")
                            conn.rollback()
                            continue
            
            return jsonify({
                'symptoms': symptoms,
                'predictions': [{'disease': d, 'confidence': c} for d, c in filtered_preds],
                'recommendations': recommendations
            })
            
        finally:
            if cursor:
                cursor.close()
            if conn:
                conn.close()
        
    except Exception as e:
        logger.error(f"Error in analyze_symptoms: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/patient/<patient_id>', methods=['GET'])
def get_patient(patient_id):
    log_request_user('get_patient')
    """Get patient information and history."""
    try:
        history = prescription_system.get_patient_history(patient_id)
        return jsonify(history)
    except Exception as e:
        logger.error(f"Error getting patient data: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/prescription', methods=['POST'])
def create_prescription():
    log_request_user('create_prescription')
    """Create a new prescription."""
    try:
        # Check if user is authenticated and has doctor role
        if 'user_id' not in session or session.get('role') != 'doctor':
            return jsonify({'error': 'Unauthorized - only doctors can create prescriptions'}), 403

        data = request.get_json()
        success = prescription_system.create_prescription(
            patient_id=data['patient_id'],
            medication=data['medication'],
            dosage=data['dosage'],
            frequency=data['frequency'],
            duration=data['duration'],
            quantity=data['quantity']
        )
        
        if success:
            return jsonify({'message': 'Prescription created successfully'})
        else:
            return jsonify({'error': 'Failed to create prescription'}), 400
            
    except Exception as e:
        logger.error(f"Error creating prescription: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/inventory', methods=['GET'])
def get_inventory():
    log_request_user('get_inventory')
    """Get current inventory status."""
    try:
        status = prescription_system.get_inventory_status()
        # Convert DataFrame to list of dicts if present
        if 'report' in status and hasattr(status['report'], 'to_dict'):
            status['report'] = status['report'].to_dict(orient='records')
        return jsonify(status)
    except Exception as e:
        logger.error(f"Error getting inventory status: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/inventory', methods=['POST'])
def add_medication():
    log_request_user('add_medication')
    """Add a new medication to inventory."""
    try:
        data = request.get_json()
        success = prescription_system.inventory.add_medication(
            medication_id=data['medication_id'],
            name=data['name'],
            quantity=data['quantity'],
            unit=data['unit'],
            expiration_date=data['expiration_date'],
            reorder_point=data['reorder_point'],
            supplier=data['supplier']
        )
        
        if success:
            return jsonify({'message': 'Medication added successfully'})
        else:
            return jsonify({'error': 'Failed to add medication'}), 400
            
    except Exception as e:
        logger.error(f"Error adding medication: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/medical-history/<patient_id>', methods=['GET'])
def get_medical_history(patient_id):
    log_request_user('get_medical_history')
    """Get detailed medical history for a patient with optional filtering."""
    try:
        # Check if user is authenticated
        if 'user_id' not in session:
            return jsonify({'error': 'Authentication required'}), 401
            
        # Get query parameters for filtering
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        include_prescriptions = request.args.get('include_prescriptions', 'true').lower() == 'true'
        include_symptoms = request.args.get('include_symptoms', 'true').lower() == 'true'
        
        # Get patient record
        record = prescription_system.patient_history.get_patient_record(patient_id)
        if not record:
            return jsonify({'error': 'Patient record not found'}), 404
            
        # Check if the authenticated user has permission to access this record
        # For now, we'll allow access if the user is the patient or has a role of 'doctor'
        user_role = session.get('role', '')
        if str(session['user_id']) != str(patient_id) and user_role != 'doctor':
            return jsonify({'error': 'Unauthorized access'}), 403
            
        # Build response
        response = {
            'patient_id': record['patient_id'],
            'personal_info': record['personal_info'],
            'medical_history': record['medical_history'],
            'allergies': record['medical_history'].get('allergies', []),
            'conditions': record['medical_history'].get('conditions', []),
            'last_updated': record['created_at']
        }
        
        # Add prescriptions if requested
        if include_prescriptions:
            prescriptions = prescription_system.patient_history.get_prescription_history(
                patient_id,
                start_date,
                end_date
            )
            response['prescriptions'] = prescriptions
            
        # Add symptom history if requested
        if include_symptoms and 'symptom_history' in record:
            response['symptom_history'] = record['symptom_history']
            
        return jsonify(response)
        
    except Exception as e:
        logger.error(f"Error retrieving medical history: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/register', methods=['POST'])
def register():
    log_request_user('register')
    logger.info(f"Session data at start of /api/register: {dict(session)}")

    # Initialize components if not already done
    if not prescription_system or not db_manager:
        initialize_system()
        
    data = request.get_json()
    logger.info(f"Registration attempt with data: {data}")
    email = data.get('email')
    password = data.get('password')
    user_id = str(uuid.uuid4())  # Always generate a new UUID for user_id
    role = data.get('role')
    name = data.get('name')
    dob = data.get('dob')
    gender = data.get('gender')
    
    # Validate required fields
    if not email:
        logger.warning("Registration failed: email is required")
        return jsonify({'error': 'email is required for registration'}), 400
    if not password:
        logger.warning("Registration failed: password is required")
        return jsonify({'error': 'password is required for registration'}), 400
    if not name:
        logger.warning("Registration failed: name is required")
        return jsonify({'error': 'name is required for registration'}), 400
    if not role or not dob:
        logger.warning("Registration failed: role and dob are required")
        return jsonify({'error': 'role and dob are required'}), 400
    if not gender:
        logger.warning("Registration failed: gender is required")
        return jsonify({'error': 'gender is required for registration'}), 400
    
    # Validate role
    allowed_roles = ['doctor', 'pharmacist', 'cashier', 'administrator', 'technician', 'patient']
    if role not in allowed_roles:
        logger.warning(f"Registration failed: Invalid role '{role}'")
        return jsonify({'error': f'Invalid role. Must be one of: {", ".join(allowed_roles)}'}), 400
    
    # Check for duplicate email
    existing_user = db_manager.get_user_by_email(email)
    if existing_user:
        logger.warning(f"Registration failed: User with email '{email}' already exists")
        return jsonify({'error': 'A user with this email already exists'}), 400
    
    # Calculate age from dob
    if dob:
        try:
            dob_date = datetime.strptime(dob, '%Y-%m-%d')
            today = datetime.today()
            age = today.year - dob_date.year - ((today.month, today.day) < (dob_date.month, dob_date.day))
            logger.info(f"Calculated age: {age}")
        except Exception as e:
            logger.error(f"Registration failed: Error calculating age from dob {dob}: {e}")
            return jsonify({'error': 'dob must be in YYYY-MM-DD format'}), 400
    else:
        age = None
        
    if age is None:
        logger.warning("Registration failed: Could not calculate age from dob")
        return jsonify({'error': 'Could not calculate age from dob'}), 400
        
    # Create user in database
    logger.info(f"Creating user in DB: {email}, role: {role}")
    success = db_manager.create_user(user_id, email, password, name, role, dob, gender)
    if not success:
        logger.error("Registration failed: Failed to create user record in DB")
        return jsonify({'error': 'Failed to create user record'}), 500
    
    logger.info(f"User created successfully in DB: {user_id}")

    # If user is a patient, create their medical history record
    if role == 'patient':
        personal_info = {
            'name': name,
            'email': email,
            'role': role,
            'dob': dob,
            'gender': gender
        }
        success = prescription_system.create_patient(user_id, personal_info)
        if not success:
            logger.error("Failed to create patient medical history record")
            # Don't return error here, as the user was created successfully
            # Just log the error and continue

    # Set session data
    session['user_id'] = user_id
    session['role'] = role
    session['name'] = name
    session['dob'] = dob
    session['age'] = age
    session['email'] = email
    session['gender'] = gender
    session.permanent = True  # Make the session persistent
    
    # Log session data after setting
    logger.info(f"Session data set after registration: {dict(session)}")
    
    # Explicitly mark session as modified
    session.modified = True
    
    response_data = {
        'message': 'Registration successful',
        'user': {
            'user_id': user_id,
            'email': email,
            'name': name,
            'role': role,
            'dob': dob,
            'age': age,
            'gender': gender
        }
    }
    
    response = jsonify(response_data)

    # Manually add the Set-Cookie header for the session
    # This uses Flask's session interface to serialize the session and create the header
    app.session_interface.save_session(app, session, response)

    # Log response headers before returning (will include Set-Cookie if successful)
    logger.info(f"Response headers before returning from /api/register: {response.headers}")

    return response

@app.route('/api/login', methods=['POST'])
def login():
    log_request_user('login')
    logger.info(f"Session data at start of /api/login: {dict(session)}")
    session.clear()  # Clear any existing session data to avoid stale user_id
    logger.info(f"Session cleared at start of /api/login: {dict(session)}")

    data = request.get_json()
    logger.info(f"Login attempt with data: {data}")
    email = data.get('email')
    password = data.get('password')
    if not email or not password:
        logger.warning("Login failed: email or password missing")
        return jsonify({'error': 'email and password are required'}), 400
        
    # Initialize components if not already done
    if not prescription_system or not db_manager:
        initialize_system()
        
    try:
        # Get user from database
        logger.info(f"Attempting to retrieve user by email: {email}")
        user = db_manager.get_user_by_email(email)
        if not user:
            logger.warning(f"Login failed: User not found for email: {email}")
            return jsonify({'error': 'User not found'}), 404
            
        # Log user data for debugging
        logger.info(f"Retrieved user data for login: {user}")
            
        # Verify password (in a real system, this would be a secure hash comparison)
        logger.info("Verifying password...")
        if password != user['password']:
            logger.warning("Login failed: Invalid password")
            return jsonify({'error': 'Invalid password'}), 401
        logger.info("Password verification successful.")
            
        # Set all required session data
        session['user_id'] = user['id']
        session['role'] = user['role']
        session['name'] = user['name']
        session['email'] = email
        session['dob'] = user['dob'].strftime('%Y-%m-%d') if isinstance(user['dob'], date) else str(user['dob'])
        session['gender'] = user['gender']
        session.permanent = True  # Make the session persistent
        
        # Log session data after setting
        logger.info(f"Session data set after login: {dict(session)}")
        
        # Explicitly mark session as modified
        session.modified = True
        
        response = jsonify({
            'message': 'Login successful',
            'user': {
                'user_id': user['id'],
                'email': email,
                'name': user['name'],
                'role': user['role'],
                'dob': session['dob'],
                'gender': user['gender']
            }
        })

        # Manually add the Set-Cookie header for the session
        app.session_interface.save_session(app, session, response)

        # Log response headers before returning
        logger.info(f"Response headers before returning from /api/login: {response.headers}")

        return response
        
    except Exception as e:
        logger.error(f"Login error: {str(e)}")
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/logout', methods=['POST'])
def logout():
    log_request_user('logout')
    logger.info(f"Session data at start of /api/logout: {dict(session)}")

    # Clear all session data
    session.clear()
    # Explicitly mark session as modified
    session.modified = True
    logger.info(f"Session data after logout: {dict(session)}")

    response = jsonify({'message': 'Logged out successfully'})

    # Manually save session to response to ensure the session cookie is cleared
    app.session_interface.save_session(app, session, response)

    logger.info(f"Response headers before returning from /api/logout: {response.headers}")

    return response

@app.route('/api/user', methods=['GET'])
def get_current_user():
    """Get current authenticated user's data from session."""
    log_request_user('get_current_user')
    logger.info(f"Session data at start of /api/user: {dict(session)}")

    if 'user_id' in session:
        logger.info("user_id found in session.")
        # Return user data from session
        user_data = {
            'user_id': session['user_id'],
            'email': session.get('email'),
            'name': session.get('name'),
            'role': session.get('role'),
            'dob': session.get('dob'),
            'age': session.get('age'),
            'gender': session.get('gender'),
        }
        logger.info(f"User data retrieved from session: {user_data['user_id']}")
        response = jsonify(user_data)
        logger.info(f"Response headers before returning from /api/user (authenticated): {response.headers}")
        return response
    else:
        # Return 401 if user is not in session
        logger.warning("User data not found in session for /api/user. Sending 401.")
        response = jsonify({'error': 'Unauthorized'})
        logger.info(f"Response headers before returning from /api/user (unauthenticated): {response.headers}")
        return response, 401

@app.route('/api/prescriptions/pending', methods=['GET'])
def get_pending_prescriptions():
    log_request_user('get_pending_prescriptions')
    logger.info(f"Session data at start of /api/prescriptions/pending: {dict(session)}")
    """Get all pending prescriptions that need doctor approval."""
    try:
        # Check if user is a doctor
        if session.get('role') != 'doctor':
            logger.warning(f"Access denied to /api/prescriptions/pending: User role is {session.get('role')}")
            return jsonify({'error': 'Only doctors can view pending prescriptions'}), 403
        logger.info("User is a doctor. Proceeding to get pending prescriptions.")
            
        pending_prescriptions = prescription_system.get_pending_prescriptions()
        logger.info(f"Retrieved {len(pending_prescriptions)} pending prescriptions.")
        response = jsonify(pending_prescriptions)
        logger.info(f"Response headers before returning from /api/prescriptions/pending: {response.headers}")
        return response
    except Exception as e:
        logger.error(f"Error getting pending prescriptions: {str(e)}")
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/prescriptions/<prescription_id>/approve', methods=['POST'])
def approve_prescription(prescription_id):
    """Approve a specific prescription."""
    try:
        # Check if user is authenticated and has doctor role
        if 'user_id' not in session or session.get('role') != 'doctor':
            logger.warning(f"Unauthorized access attempt to approve prescription {prescription_id} by user with role {session.get('role')}")
            return jsonify({'error': 'Unauthorized - doctor access required'}), 403

        # Get modifications from request
        data = request.get_json()
        if not data:
            logger.warning(f"No modifications provided for prescription {prescription_id}")
            return jsonify({'error': 'No modifications provided'}), 400

        # Get a fresh database connection
        conn = None
        cursor = None
        try:
            conn = db_manager._get_connection()
            if not conn:
                logger.error("Failed to get database connection")
                return jsonify({'error': 'Database connection failed'}), 500
                
            cursor = conn.cursor(dictionary=True)
            
            # Get the prescription
            query = """
                SELECT p.*, m.name as medication_name
                FROM prescriptions p
                JOIN medications m ON p.medication_id = m.id
                WHERE p.id = %s AND p.status = 'pending'
            """
            cursor.execute(query, (prescription_id,))
            prescription = cursor.fetchone()
            
            if not prescription:
                logger.warning(f"Prescription {prescription_id} not found or not pending")
                return jsonify({'error': 'Prescription not found or not pending'}), 404

            # Prepare updates
            updates = {
                'status': 'approved',
                'approved_at': datetime.now(),
                'approved_by': session['user_id']
            }

            # Process medication updates if provided
            if 'medications' in data and isinstance(data['medications'], list) and len(data['medications']) > 0:
                med = data['medications'][0]  # Process first medication
                if 'dosage' in med:
                    updates['dosage'] = med['dosage']
                if 'frequency' in med:
                    updates['frequency'] = med['frequency']
                if 'quantity' in med:
                    try:
                        updates['quantity'] = int(med['quantity'])
                    except (ValueError, TypeError):
                        logger.warning(f"Invalid quantity value for prescription {prescription_id}: {med['quantity']}")
                        return jsonify({'error': 'Invalid quantity value'}), 400
                if 'duration' in med:
                    try:
                        if ' to ' in med['duration']:
                            start_str, end_str = med['duration'].split(' to ')
                            end_date = datetime.strptime(end_str.strip(), '%b %d, %Y').date()
                            updates['end_date'] = end_date
                    except (ValueError, AttributeError) as e:
                        logger.warning(f"Invalid duration format for prescription {prescription_id}: {med['duration']}, error: {str(e)}")
                        # Don't return error, just skip duration update

            if 'notes' in data:
                updates['notes'] = data['notes']

            # Build and execute update query
            update_query_parts = []
            update_params = []
            for field, value in updates.items():
                update_query_parts.append(f"{field} = %s")
                update_params.append(value)
            update_params.append(prescription_id)

            update_query = f"UPDATE prescriptions SET {', '.join(update_query_parts)} WHERE id = %s"
            cursor.execute(update_query, update_params)
            conn.commit()
            
            # Get the updated prescription
            cursor.execute(query, (prescription_id,))
            updated = cursor.fetchone()
            
            logger.info(f"Successfully approved prescription {prescription_id}")
            return jsonify({
                'message': 'Prescription approved successfully',
                'prescription': updated
            }), 200

        except Error as e:
            if conn:
                conn.rollback()
            logger.error(f"Database error approving prescription {prescription_id}: {str(e)}")
            return jsonify({'error': 'Database error approving prescription'}), 500
        finally:
            if cursor:
                try:
                    cursor.close()
                except:
                    pass
            if conn:
                try:
                    conn.close()
                except:
                    pass

    except Exception as e:
        logger.error(f"Error approving prescription {prescription_id}: {str(e)}")
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}")
        return jsonify({'error': 'An unexpected error occurred while approving prescription'}), 500

@app.route('/api/prescriptions/approved', methods=['GET'])
def get_approved_prescriptions():
    """Get all approved prescriptions."""
    try:
        # Check if user is authenticated
        if 'user_id' not in session:
            return jsonify({'error': 'Authentication required'}), 401
            
        # Allow both doctors and pharmacists to view approved prescriptions
        user_role = session.get('role')
        if user_role not in ['doctor', 'pharmacist']:
            return jsonify({'error': 'Only doctors and pharmacists can view approved prescriptions'}), 403
            
        approved_prescriptions = prescription_system.get_approved_prescriptions()
        return jsonify(approved_prescriptions)
    except Exception as e:
        logger.error(f"Error getting approved prescriptions: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/prescriptions', methods=['GET'])
def get_all_prescriptions():
    """Get all prescriptions with optional filtering."""
    try:
        conn = db_manager._get_connection()
        cursor = conn.cursor(dictionary=True)
        
        # Query to get prescriptions with all necessary details
        query = """
            SELECT p.*, 
                   m.name as medication_name, m.generic_name,
                   u.name as doctor_name, u.email as doctor_email,
                   pat.name as patient_name, pat.email as patient_email
            FROM prescriptions p
            JOIN medications m ON p.medication_id = m.id
            JOIN users u ON p.prescribed_by = u.id
            JOIN users pat ON p.patient_id = pat.id
            ORDER BY p.created_at DESC
        """
        cursor.execute(query)
        prescriptions = cursor.fetchall()
        
        formatted_prescriptions = []
        for p in prescriptions:
            try:
                # Create base prescription object with all necessary fields
                prescription = {
                    'id': p['id'],
                    'patient_id': p['patient_id'],
                    'patient_name': p['patient_name'],
                    'patient_email': p['patient_email'],
                    'medication_id': p['medication_id'],
                    'medication_name': p['medication_name'],
                    'generic_name': p['generic_name'],
                    'prescribed_by': p['prescribed_by'],
                    'doctor_name': p['doctor_name'],
                    'doctor_email': p['doctor_email'],
                    'dosage': p['dosage'],
                    'frequency': p['frequency'],
                    'quantity': p['quantity'],
                    'status': p['status'],
                    'notes': p['notes'],
                    'created_at': p['created_at'].strftime('%a, %d %b %Y %H:%M:%S GMT') if p['created_at'] else None
                }

                # Add optional fields only if they exist
                if p.get('start_date'):
                    prescription['start_date'] = p['start_date'].strftime('%Y-%m-%d')
                if p.get('end_date'):
                    prescription['end_date'] = p['end_date'].strftime('%Y-%m-%d')
                if p.get('approved_at'):
                    prescription['approved_at'] = p['approved_at'].strftime('%a, %d %b %Y %H:%M:%S GMT')
                if p.get('approved_by'):
                    prescription['approved_by'] = p['approved_by']

                formatted_prescriptions.append(prescription)
            except Exception as e:
                logger.error(f"Error formatting prescription {p.get('id')}: {str(e)}")
                continue

        return jsonify(formatted_prescriptions), 200
    except Exception as e:
        logger.error(f"Error getting prescriptions: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/prescriptions/<prescription_id>', methods=['GET'])
def get_prescription(prescription_id):
    """Get a specific prescription by ID."""
    try:
        prescription = prescription_system.get_prescription(prescription_id)
        if prescription:
            return jsonify(prescription)
        else:
            return jsonify({'error': 'Prescription not found'}), 404
    except Exception as e:
        logger.error(f"Error getting prescription: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/prescriptions/<prescription_id>', methods=['PUT', 'PATCH'])
def update_prescription_endpoint(prescription_id):
    """Update a prescription with partial modifications."""
    log_request_user('update_prescription_endpoint')
    if 'user_id' not in session:
        logger.warning("update_prescription_endpoint: User not authenticated")
        return jsonify({'error': 'Unauthorized'}), 403
        
    # Check if user has permission (doctor or pharmacist)
    user_role = session.get('role')
    if user_role not in ['doctor', 'pharmacist']:
        logger.warning(f"update_prescription_endpoint: User with role {user_role} attempted to update prescription")
        return jsonify({'error': 'Only doctors and pharmacists can update prescriptions'}), 403
        
    data = request.get_json()
    if not data:
        logger.warning("update_prescription_endpoint: No data provided in request body")
        return jsonify({'error': 'No data provided'}), 400
        
    logger.info(f"update_prescription_endpoint: Received data for update: {data}")

    # Get a single database connection for all operations
    conn = None
    try:
        conn = db_manager._get_connection()
        cursor = conn.cursor(dictionary=True)
        
        # Get current prescription from the database
        query = """
            SELECT p.id, p.patient_id, p.medication_id, p.prescribed_by, p.dosage, p.frequency, p.start_date, p.end_date, p.status, p.generic_name, p.notes, p.created_at,
                   m.name as medication_name
            FROM prescriptions p
            JOIN medications m ON p.medication_id = m.id
            WHERE p.id = %s
        """
        cursor.execute(query, (prescription_id,))
        current = cursor.fetchone()
        
        if not current:
            logger.warning(f"update_prescription_endpoint: Prescription with ID {prescription_id} not found")
            return jsonify({'error': 'Prescription not found'}), 404
        
        logger.info(f"update_prescription_endpoint: Found current prescription: {current}")
        
        # Validate and apply updates
        allowed_fields = {
            'dosage': str,
            'frequency': str,
            'duration': str,
            'quantity': int,
            'notes': str,
            'status': str
        }
        
        updates = {}
        for field, value in data.items():
            if field in allowed_fields:
                # Basic type validation
                if allowed_fields[field] == int:
                    try:
                        updates[field] = int(value)
                    except (ValueError, TypeError):
                        logger.warning(f"update_prescription_endpoint: Invalid type for {field}. Expected int, got {type(value).__name__}")
                        return jsonify({'error': f'Invalid type for {field}. Expected integer.'}), 400
                elif allowed_fields[field] == str:
                    if not isinstance(value, str):
                        logger.warning(f"update_prescription_endpoint: Invalid type for {field}. Expected str, got {type(value).__name__}")
                        return jsonify({'error': f'Invalid type for {field}. Expected string.'}), 400
                    updates[field] = value
            elif field == 'medications':
                # Handle updates to medication details
                if not isinstance(value, list):
                    logger.warning("update_prescription_endpoint: medications must be an array")
                    return jsonify({'error': 'medications must be an array'}), 400
                    
                if len(value) == 0:
                    logger.warning("update_prescription_endpoint: medications array cannot be empty")
                    return jsonify({'error': 'medications array cannot be empty'}), 400
                    
                # Process each medication in the array
                for med in value:
                    if not isinstance(med, dict):
                        logger.warning("update_prescription_endpoint: each medication must be an object")
                        return jsonify({'error': 'each medication must be an object'}), 400
                        
                    # Extract and validate medication fields
                    if 'dosage' in med:
                        if not isinstance(med['dosage'], str):
                            logger.warning("update_prescription_endpoint: medication dosage must be a string")
                            return jsonify({'error': 'medication dosage must be a string'}), 400
                        updates['dosage'] = med['dosage']
                        
                    if 'frequency' in med:
                        if not isinstance(med['frequency'], str):
                            logger.warning("update_prescription_endpoint: medication frequency must be a string")
                            return jsonify({'error': 'medication frequency must be a string'}), 400
                        updates['frequency'] = med['frequency']
                        
                    if 'quantity' in med:
                        try:
                            updates['quantity'] = int(med['quantity'])
                        except (ValueError, TypeError):
                            logger.warning("update_prescription_endpoint: medication quantity must be an integer")
                            return jsonify({'error': 'medication quantity must be an integer'}), 400
                            
                    if 'duration' in med:
                        if not isinstance(med['duration'], str):
                            logger.warning("update_prescription_endpoint: medication duration must be a string")
                            return jsonify({'error': 'medication duration must be a string'}), 400
                        # Parse duration string to extract end date if needed
                        try:
                            if ' to ' in med['duration']:
                                start_str, end_str = med['duration'].split(' to ')
                                end_date = datetime.strptime(end_str.strip(), '%b %d, %Y').date()
                                updates['end_date'] = end_date
                        except ValueError as e:
                            logger.warning(f"update_prescription_endpoint: Invalid duration format: {str(e)}")
                            # Don't return error, just skip end date update
                            
                    # Only process the first medication for now
                    break
            else:
                logger.warning(f"update_prescription_endpoint: Ignoring unknown field: {field}")

        logger.info(f"update_prescription_endpoint: Applying updates: {updates}")
                
        if not updates:
            logger.warning("update_prescription_endpoint: No valid fields to update after filtering")
            return jsonify({'error': 'No valid fields to update'}), 400
            
        # Update the prescription in the database
        try:
            # Build the update query dynamically
            update_query_parts = []
            update_params = []
            for field, value in updates.items():
                update_query_parts.append(f"{field} = %s")
                update_params.append(value)
                
            # Add the prescription_id to the parameters
            update_params.append(prescription_id)

            update_query = f"UPDATE prescriptions SET {', '.join(update_query_parts)} WHERE id = %s"
            
            logger.info(f"update_prescription_endpoint: Update query: {update_query}")
            logger.info(f"update_prescription_endpoint: Update params: {update_params}")

            cursor.execute(update_query, update_params)
            conn.commit()
            
            logger.info(f"update_prescription_endpoint: Prescription {prescription_id} updated successfully")
            
            # Refetch the updated prescription
            cursor.execute(query, (prescription_id,))
            updated = cursor.fetchone()
            logger.info(f"update_prescription_endpoint: Refetched updated prescription: {updated}")
            
            return jsonify({
                'message': 'Prescription updated successfully',
                'prescription': updated
            }), 200
            
        except Error as e:
            conn.rollback()
            logger.error(f"update_prescription_endpoint: Database error updating prescription: {str(e)}")
            return jsonify({'error': 'Database error updating prescription'}), 500
            
    except Exception as e:
        logger.error(f"update_prescription_endpoint: Unexpected error: {str(e)}")
        return jsonify({'error': 'An unexpected error occurred'}), 500
    finally:
        if conn:
            conn.close()

@app.route('/api/inventory/update', methods=['POST'])
def update_inventory():
    """Update medication stock level."""
    try:
        data = request.get_json()
        success = prescription_system.inventory.update_stock(
            medication_id=data['medication_id'],
            quantity_change=data['quantity_change']
        )
        
        if success:
            return jsonify({'message': 'Stock updated successfully'})
        else:
            return jsonify({'error': 'Failed to update stock'}), 400
            
    except Exception as e:
        logger.error(f"Error updating stock: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/patients', methods=['GET'])
def get_patients():
    """Get all patient records with pagination and search."""
    cursor = None
    conn = None
    try:
        # Get query parameters
        page = int(request.args.get('page', 1))
        search = request.args.get('search', '')
        per_page = 10
        offset = (page - 1) * per_page

        # Get database connection
        conn = db_manager._get_connection()
        if not conn:
            logger.error("Failed to get database connection")
            return jsonify({'error': 'Database connection error'}), 500

        cursor = conn.cursor(dictionary=True)
        if not cursor:
            logger.error("Failed to create cursor")
            return jsonify({'error': 'Database cursor error'}), 500

        # Build the base query
        query = """
            SELECT u.*, pmh.allergies, pmh.conditions,
                   (SELECT MAX(created_at) FROM symptom_history WHERE patient_id = u.id) as last_visit
            FROM users u
            LEFT JOIN patient_medical_history pmh ON u.id = pmh.patient_id
            WHERE u.role = 'patient'
        """
        params = []

        # Add search condition if search term is provided
        if search:
            query += " AND (u.name LIKE %s OR u.email LIKE %s)"
            search_term = f"%{search}%"
            params.extend([search_term, search_term])

        # Add pagination
        query += " ORDER BY u.created_at DESC LIMIT %s OFFSET %s"
        params.extend([per_page, offset])

        # Execute query
        cursor.execute(query, params)
        patients = cursor.fetchall()

        # Get total count for pagination
        count_query = """
            SELECT COUNT(*) as total
            FROM users u
            WHERE u.role = 'patient'
        """
        if search:
            count_query += " AND (u.name LIKE %s OR u.email LIKE %s)"
            cursor.execute(count_query, [f"%{search}%", f"%{search}%"])
        else:
            cursor.execute(count_query)
        
        total = cursor.fetchone()['total']

        # Format the response
        formatted_patients = []
        for patient in patients:
            # Parse JSON fields
            allergies = json.loads(patient['allergies']) if patient['allergies'] else []
            conditions = json.loads(patient['conditions']) if patient['conditions'] else []
            
            # Calculate age
            age = calculate_age(patient['dob']) if patient['dob'] else None
            
            formatted_patients.append({
                'id': patient['id'],
                'name': patient['name'],
                'email': patient['email'],
                'age': age,
                'gender': patient['gender'],
                'lastVisit': patient['last_visit'].isoformat() if patient['last_visit'] else None,
                'medicalHistory': conditions,
                'allergies': allergies,
                'status': 'Active'  # You might want to add a status field to the users table
            })

        return jsonify({
            'patients': formatted_patients,
            'total': total,
            'page': page,
            'per_page': per_page,
            'total_pages': (total + per_page - 1) // per_page
        })

    except Exception as e:
        logger.error(f"Error retrieving all patient records: {str(e)}")
        if conn:
            try:
                conn.rollback()
            except:
                pass
        return jsonify({'error': 'Internal server error'}), 500
    finally:
        if cursor:
            try:
                cursor.close()
            except:
                pass
        if conn:
            try:
                conn.close()
            except:
                pass

def calculate_age(dob):
    """Calculate age from date of birth."""
    if not dob:
        return None
    today = datetime.today()
    return today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))

@app.route('/api/user/<user_id>', methods=['GET'])
def get_user_by_id(user_id):
    """Get user information by ID with caching."""
    # Only log once per minute per user to reduce log spam
    cache_key = f"log_user_{user_id}"
    current_time = time.time()
    if cache_key not in getattr(get_user_by_id, '_last_log', {}):
        get_user_by_id._last_log = {}
    
    if current_time - get_user_by_id._last_log.get(cache_key, 0) > 60:
        logger.info(f"get_user_by_id: Looking up user with ID: {user_id}")
        get_user_by_id._last_log[cache_key] = current_time
    
    try:
        # Check if user is authenticated
        if 'user_id' not in session:
            return jsonify({'error': 'Authentication required'}), 401
            
        # Get user from database using the DatabaseManager method with caching
        user = db_manager.get_user_by_id(user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
            
        return jsonify(user)
        
    except Exception as e:
        logger.error(f"Error getting user by ID: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/prescriptions/patient/<patient_id>', methods=['GET'])
def get_patient_prescriptions(patient_id):
    """Get all prescriptions for a specific patient."""
    log_request_user('get_patient_prescriptions')
    logger.info(f"Session data at start of /api/prescriptions/patient/{patient_id}: {dict(session)}")
    
    try:
        conn = db_manager._get_connection()
        cursor = conn.cursor(dictionary=True)
        
        # First verify the patient exists
        cursor.execute("SELECT id FROM users WHERE id = %s AND role = 'patient'", (patient_id,))
        if not cursor.fetchone():
            logger.warning(f"get_patient_prescriptions: Patient {patient_id} not found")
            return jsonify({'error': 'Patient not found'}), 404
        
        # Query to get prescriptions with all necessary details
        query = """
            SELECT p.*, 
                   m.name as medication_name, m.generic_name,
                   u.name as doctor_name, u.email as doctor_email,
                   pat.name as patient_name, pat.email as patient_email
            FROM prescriptions p
            JOIN medications m ON p.medication_id = m.id
            JOIN users u ON p.prescribed_by = u.id
            JOIN users pat ON p.patient_id = pat.id
            WHERE p.patient_id = %s
            ORDER BY p.created_at DESC
        """
        cursor.execute(query, (patient_id,))
        prescriptions = cursor.fetchall()
        
        # Format the response
        formatted_prescriptions = []
        for p in prescriptions:
            try:
                prescription = {
                    'id': p['id'],
                    'patient_id': p['patient_id'],
                    'patient_name': p['patient_name'],
                    'patient_email': p['patient_email'],
                    'medication_id': p['medication_id'],
                    'medication_name': p['medication_name'],
                    'generic_name': p['generic_name'],
                    'prescribed_by': p['prescribed_by'],
                    'doctor_name': p['doctor_name'],
                    'doctor_email': p['doctor_email'],
                    'dosage': p['dosage'],
                    'frequency': p['frequency'],
                    'quantity': p['quantity'],
                    'status': p['status'],
                    'notes': p['notes'],
                    'created_at': p['created_at'].strftime('%a, %d %b %Y %H:%M:%S GMT') if p['created_at'] else None
                }

                # Add optional fields only if they exist
                if p.get('start_date'):
                    prescription['start_date'] = p['start_date'].strftime('%Y-%m-%d')
                if p.get('end_date'):
                    prescription['end_date'] = p['end_date'].strftime('%Y-%m-%d')
                if p.get('approved_at'):
                    prescription['approved_at'] = p['approved_at'].strftime('%a, %d %b %Y %H:%M:%S GMT')
                if p.get('approved_by'):
                    prescription['approved_by'] = p['approved_by']

                formatted_prescriptions.append(prescription)
            except Exception as e:
                logger.error(f"Error formatting prescription {p.get('id')}: {str(e)}")
                continue
        
        logger.info(f"get_patient_prescriptions: Found {len(formatted_prescriptions)} prescriptions for patient {patient_id}")
        return jsonify(formatted_prescriptions)
        
    except Error as e:
        logger.error(f"Database error getting patient prescriptions: {str(e)}")
        return jsonify({'error': 'Database error occurred while fetching prescriptions'}), 500

@app.route('/api/users/batch', methods=['POST'])
def get_users_batch():
    """Get information for multiple users in a single request."""
    log_request_user('get_users_batch')
    logger.info(f"Session data at start of /api/users/batch: {dict(session)}")
    
    try:
        # Check if user is authenticated
        if 'user_id' not in session:
            logger.warning("get_users_batch: User not authenticated")
            return jsonify({'error': 'Authentication required'}), 401
            
        # Get user IDs from request
        data = request.get_json()
        if not data or 'user_ids' not in data:
            logger.warning("get_users_batch: No user_ids provided in request")
            return jsonify({'error': 'No user IDs provided'}), 400
            
        user_ids = data['user_ids']
        if not isinstance(user_ids, list):
            logger.warning("get_users_batch: user_ids must be a list")
            return jsonify({'error': 'user_ids must be a list'}), 400
            
        # Get users from database
        users = []
        for user_id in user_ids:
            user = db_manager.get_user_by_id(user_id)
            if user:
                users.append(user)
                
        logger.info(f"get_users_batch: Retrieved {len(users)} users")
        return jsonify(users)
        
    except Exception as e:
        logger.error(f"Error getting users batch: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

class PrescriptionSystem:
    def __init__(self, db_manager, data_dir: str = "data/processed"):
        """Initialize the prescription system."""
        self.data_dir = Path(data_dir)
        self.data_dir.mkdir(parents=True, exist_ok=True)
        logger.info(f"PrescriptionSystem using data directory: {self.data_dir.resolve()}")
        
        # Initialize components
        self.medication_recommender = MedicationRecommender(data_dir)
        self.patient_history = PatientHistoryManager(db_manager=db_manager)  # Pass db_manager to PatientHistoryManager
        self.inventory = InventoryManager(data_dir)
        self.security = SecurityManager(data_dir)
        self.sync = DataSyncManager(data_dir)
        self.db_manager = db_manager  # Use provided db_manager
        
        # Start data synchronization
        self.sync.start_sync()
        
        # Set up update handlers
        self._setup_update_handlers()

    def get_inventory_status(self):
        """
        Get current inventory status.
        
        Returns:
            Dict containing inventory report and status information
        """
        try:
            # Generate inventory report using InventoryManager
            report = self.inventory.generate_inventory_report()
            
            # Get low stock items
            low_stock = self.inventory.get_low_stock_items()
            
            # Get expiring medications (within 30 days)
            expiring = self.inventory.get_expiring_medications(days_threshold=30)
            
            return {
                'report': report,
                'low_stock_count': len(low_stock),
                'expiring_count': len(expiring),
                'total_items': len(self.inventory.inventory),
                'last_updated': datetime.now().isoformat()
            }
        except Exception as e:
            logger.error(f"Error getting inventory status: {str(e)}")
            raise

    def _setup_update_handlers(self):
        # Implementation of _setup_update_handlers method
        pass

    def close(self):
        """Close the database connection."""
        if hasattr(self, 'db_manager') and self.db_manager._get_connection().is_connected():
            self.db_manager._get_connection().close()
            logger.info("Database connection closed")

# Request logging middleware
@app.before_request
def log_request():
    logger.info(f"Incoming request: {request.method} {request.path}")
    logger.info(f"Request headers: {request.headers}")
    # Optionally log request body for POST/PUT requests, but be careful with sensitive data
    # if request.method in ['POST', 'PUT'] and request.data:
    #     logger.info(f"Request body: {request.data}")

@app.after_request
def log_response(response):
    logger.info(f"Outgoing response: {request.method} {request.path} -> {response.status}")
    logger.info(f"Response headers: {response.headers}")
    return response

# Make sessions permanent by default
@app.before_request
def make_session_permanent():
    session.permanent = True

@app.after_request
def add_cache_control(response):
    """Add cache control headers to prevent caching of prescription data."""
    if request.path.startswith('/api/prescriptions'):
        response.headers['Cache-Control'] = 'no-store, no-cache, must-revalidate, max-age=0'
        response.headers['Pragma'] = 'no-cache'
        response.headers['Expires'] = '0'
    return response

@app.before_request
def ensure_db_connection():
    """Ensure database connection is available before each request."""
    if not db_manager:
        return jsonify({'error': 'Database manager not initialized'}), 500
        
    if not db_manager._pool:
        try:
            db_manager._initialize_pool()
        except Exception as e:
            logger.error(f"Failed to initialize database connection pool: {e}")
            return jsonify({'error': 'Database connection error'}), 500
            
    # Test the connection
    try:
        conn = db_manager._get_connection()
        conn.close()
    except Exception as e:
        logger.error(f"Database connection test failed: {e}")
        return jsonify({'error': 'Database connection test failed'}), 500

@app.route('/api/user/<user_id>', methods=['PUT'])
def update_user_profile(user_id):
    """Update user profile information."""
    try:
        if 'user_id' not in session:
            return jsonify({'error': 'Authentication required'}), 401
            
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
            
        # Update user in database
        success = db_manager.update_user(user_id, data)
        if not success:
            return jsonify({'error': 'Failed to update user'}), 500
            
        # Clear user cache
        db_manager.clear_user_cache(user_id)
        
        return jsonify({'message': 'User updated successfully'})
        
    except Exception as e:
        logger.error(f"Error updating user: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/users', methods=['GET'])
@login_required
def get_users():
    """Get all users with pagination and search."""
    log_request_user('get_users')
    cursor = None
    conn = None
    try:
        # Check if user has admin role
        if session.get('role') not in ['admin', 'administrator']:
            return jsonify({'error': 'Unauthorized - admin access required'}), 403

        # Get query parameters
        page = int(request.args.get('page', 1))
        search = request.args.get('search', '')
        role_filter = request.args.get('role')
        per_page = 10
        offset = (page - 1) * per_page

        # Get a fresh database connection
        conn = db_manager._get_connection()
        if not conn:
            logger.error("Failed to get database connection")
            return jsonify({'error': 'Database connection failed'}), 500

        cursor = conn.cursor(dictionary=True)

        # Build the base query
        query = """
            SELECT id, name, email, role, dob, gender, created_at
            FROM users
            WHERE 1=1
        """
        params = []

        # Add search condition if search term is provided
        if search:
            query += " AND (name LIKE %s OR email LIKE %s)"
            search_term = f"%{search}%"
            params.extend([search_term, search_term])

        # Add role filter if provided
        if role_filter:
            query += " AND role = %s"
            params.append(role_filter)

        # Add pagination
        query += " ORDER BY created_at DESC LIMIT %s OFFSET %s"
        params.extend([per_page, offset])

        # Execute query
        cursor.execute(query, params)
        users = cursor.fetchall()

        # Get total count for pagination
        count_query = "SELECT COUNT(*) as total FROM users WHERE 1=1"
        count_params = []
        if search:
            count_query += " AND (name LIKE %s OR email LIKE %s)"
            count_params.extend([f"%{search}%", f"%{search}%"])
        if role_filter:
            count_query += " AND role = %s"
            count_params.append(role_filter)
        
        cursor.execute(count_query, count_params)
        total = cursor.fetchone()['total']

        # Format dates and handle None values
        for user in users:
            if user.get('dob'):
                user['dob'] = user['dob'].strftime('%Y-%m-%d') if isinstance(user['dob'], date) else str(user['dob'])
            if user.get('created_at'):
                user['created_at'] = user['created_at'].strftime('%Y-%m-%d %H:%M:%S')

        return jsonify({
            'users': users,
            'total': total,
            'page': page,
            'per_page': per_page
        })

    except Error as e:
        logger.error(f"Database error getting users: {str(e)}")
        return jsonify({'error': 'Database error occurred'}), 500
    except Exception as e:
        logger.error(f"Error getting users: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500
    finally:
        if cursor:
            try:
                cursor.close()
            except:
                pass
        if conn:
            try:
                conn.close()
            except:
                pass

@app.route('/api/users', methods=['POST'])
@login_required
def create_user():
    """Create a new user."""
    log_request_user('create_user')
    try:
        # Check if user has admin role
        if session.get('role') not in ['admin', 'administrator']:
            return jsonify({'error': 'Unauthorized - admin access required'}), 403

        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400

        # Validate required fields
        required_fields = ['email', 'password', 'name', 'role', 'dob', 'gender']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'{field} is required'}), 400

        # Validate role
        allowed_roles = ['admin', 'pharmacist', 'doctor', 'cashier', 'technician', 'patient']
        if data['role'] not in allowed_roles:
            return jsonify({'error': f'Invalid role. Must be one of: {", ".join(allowed_roles)}'}), 400

        # Check for duplicate email
        existing_user = db_manager.get_user_by_email(data['email'])
        if existing_user:
            return jsonify({'error': 'A user with this email already exists'}), 400

        # Generate UUID for new user
        user_id = str(uuid.uuid4())

        # Create user
        success = db_manager.create_user(
            user_id=user_id,
            email=data['email'],
            password=data['password'],
            name=data['name'],
            role=data['role'],
            dob=data['dob'],
            gender=data['gender']
        )

        if not success:
            return jsonify({'error': 'Failed to create user'}), 500

        return jsonify({
            'message': 'User created successfully',
            'user_id': user_id
        }), 201

    except Exception as e:
        logger.error(f"Error creating user: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/users/<user_id>', methods=['PUT'])
@login_required
def update_user(user_id):
    """Update user information (admin only)."""
    log_request_user('update_user')
    try:
        # Check if user has admin role
        if session.get('role') not in ['admin', 'administrator']:
            return jsonify({'error': 'Unauthorized - admin access required'}), 403

        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400

        # Get existing user
        existing_user = db_manager.get_user_by_id(user_id)
        if not existing_user:
            return jsonify({'error': 'User not found'}), 404

        # Prevent updating admin users if not an admin
        if existing_user['role'] == 'admin' and session.get('role') != 'admin':
            return jsonify({'error': 'Cannot modify admin users'}), 403

        # Update user
        success = db_manager.update_user(user_id, data)
        if not success:
            return jsonify({'error': 'Failed to update user'}), 500

        # Clear user cache
        db_manager.clear_user_cache(user_id)

        return jsonify({'message': 'User updated successfully'})

    except Exception as e:
        logger.error(f"Error updating user: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/users/<user_id>/status', methods=['PUT'])
@login_required
def update_user_status(user_id):
    """Update user active status."""
    log_request_user('update_user_status')
    try:
        # Check if user has admin role
        if session.get('role') not in ['admin', 'administrator']:
            return jsonify({'error': 'Unauthorized - admin access required'}), 403

        data = request.get_json()
        if 'active' not in data:
            return jsonify({'error': 'active status is required'}), 400

        # Get existing user
        existing_user = db_manager.get_user_by_id(user_id)
        if not existing_user:
            return jsonify({'error': 'User not found'}), 404

        # Prevent deactivating admin users
        if existing_user['role'] == 'admin':
            return jsonify({'error': 'Cannot deactivate admin users'}), 403

        # Update user status
        success = db_manager.update_user(user_id, {'active': data['active']})
        if not success:
            return jsonify({'error': 'Failed to update user status'}), 500

        # Clear user cache
        db_manager.clear_user_cache(user_id)

        return jsonify({'message': 'User status updated successfully'})

    except Exception as e:
        logger.error(f"Error updating user status: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/users/<user_id>', methods=['DELETE'])
@login_required
def delete_user(user_id):
    """Delete a user."""
    log_request_user('delete_user')
    try:
        # Check if user has admin role
        if session.get('role') not in ['admin', 'administrator']:
            return jsonify({'error': 'Unauthorized - admin access required'}), 403

        # Get existing user
        existing_user = db_manager.get_user_by_id(user_id)
        if not existing_user:
            return jsonify({'error': 'User not found'}), 404

        # Prevent deleting admin users
        if existing_user['role'] == 'admin':
            return jsonify({'error': 'Cannot delete admin users'}), 403

        # Delete user
        success = db_manager.delete_user(user_id)
        if not success:
            return jsonify({'error': 'Failed to delete user'}), 500

        # Clear user cache
        db_manager.clear_user_cache(user_id)

        return jsonify({'message': 'User deleted successfully'})

    except Exception as e:
        logger.error(f"Error deleting user: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/inventory/<medication_id>', methods=['PUT'])
def update_inventory_item(medication_id):
    """Update an inventory item's details."""
    log_request_user('update_inventory_item')
    try:
        if 'user_id' not in session:
            logger.warning("update_inventory_item: User not authenticated")
            return jsonify({'error': 'Unauthorized'}), 401
            
        # Check if user has permission (pharmacist only)
        user_role = session.get('role')
        if user_role != 'pharmacist':
            logger.warning(f"update_inventory_item: User with role {user_role} attempted to update inventory")
            return jsonify({'error': 'Only pharmacists can update inventory items'}), 403
            
        data = request.get_json()
        if not data:
            logger.warning("update_inventory_item: No data provided in request body")
            return jsonify({'error': 'No data provided'}), 400
            
        logger.info(f"update_inventory_item: Received data for update: {data}")
        
        # Get current inventory item
        if medication_id not in prescription_system.inventory.inventory:
            logger.warning(f"update_inventory_item: Medication {medication_id} not found")
            return jsonify({'error': 'Medication not found'}), 404
            
        current_item = prescription_system.inventory.inventory[medication_id]
        
        # Update allowed fields
        allowed_fields = {
            'quantity': int,
            'expiry_date': str,
            'reorder_point': int,
            'price': float,
            'category': str
        }
        
        updates = {}
        for field, value in data.items():
            if field in allowed_fields:
                # Basic type validation
                if allowed_fields[field] == int:
                    try:
                        updates[field] = int(value)
                    except (ValueError, TypeError):
                        logger.warning(f"update_inventory_item: Invalid type for {field}. Expected int, got {type(value).__name__}")
                        return jsonify({'error': f'Invalid type for {field}. Expected integer.'}), 400
                elif allowed_fields[field] == float:
                    try:
                        updates[field] = float(value)
                    except (ValueError, TypeError):
                        logger.warning(f"update_inventory_item: Invalid type for {field}. Expected float, got {type(value).__name__}")
                        return jsonify({'error': f'Invalid type for {field}. Expected number.'}), 400
                elif allowed_fields[field] == str:
                    if not isinstance(value, str):
                        logger.warning(f"update_inventory_item: Invalid type for {field}. Expected str, got {type(value).__name__}")
                        return jsonify({'error': f'Invalid type for {field}. Expected string.'}), 400
                    updates[field] = value
            else:
                logger.warning(f"update_inventory_item: Ignoring unknown field: {field}")
                
        if not updates:
            logger.warning("update_inventory_item: No valid fields to update after filtering")
            return jsonify({'error': 'No valid fields to update'}), 400
            
        # Apply updates to inventory item
        try:
            for field, value in updates.items():
                if field == 'expiry_date':
                    current_item['expiration_date'] = value
                elif field == 'reorder_point':
                    current_item['reorder_point'] = value
                elif field == 'category':
                    current_item['category'] = value
                elif field == 'price':
                    current_item['price'] = value
                elif field == 'quantity':
                    current_item['quantity'] = value
                    
            current_item['last_updated'] = datetime.now().isoformat()
            
            # Save changes
            if not prescription_system.inventory._save_inventory():
                logger.error("update_inventory_item: Failed to save inventory changes")
                return jsonify({'error': 'Failed to save changes'}), 500
                
            logger.info(f"update_inventory_item: Successfully updated medication {medication_id}")
            
            # Get updated inventory status
            status = prescription_system.get_inventory_status()
            if 'report' in status and hasattr(status['report'], 'to_dict'):
                status['report'] = status['report'].to_dict(orient='records')
                
            return jsonify({
                'message': 'Inventory item updated successfully',
                'success': True,
                'inventory': status
            }), 200
            
        except Exception as e:
            logger.error(f"update_inventory_item: Error updating inventory: {str(e)}")
            return jsonify({'error': 'Failed to update inventory item'}), 500
            
    except Exception as e:
        logger.error(f"update_inventory_item: Unexpected error: {str(e)}")
        return jsonify({'error': 'An unexpected error occurred'}), 500

@app.route('/api/inventory/analytics', methods=['GET'])
@login_required
@permission_required('view_analytics')
def get_inventory_analytics():
    """Get comprehensive inventory analytics with role-based access."""
    log_request_user('get_inventory_analytics')
    cursor = None
    try:
        conn = db_manager._get_connection()
        cursor = conn.cursor(dictionary=True)
        
        # Get total inventory items and calculate total value
        cursor.execute("""
            SELECT 
                COUNT(*) as total_items,
                COALESCE(SUM(i.quantity * COALESCE(m.price, 0)), 0) as total_value
            FROM inventory i
            JOIN medications m ON i.medication_id = m.id
        """)
        totals = cursor.fetchone()
        
        # Get low stock items (quantity <= reorder_point)
        cursor.execute("""
            SELECT 
                i.id,
                m.name,
                i.quantity,
                m.reorder_point,
                m.unit,
                i.last_restocked_at
            FROM inventory i
            JOIN medications m ON i.medication_id = m.id
            WHERE i.quantity <= m.reorder_point
            ORDER BY i.quantity ASC
            LIMIT 10
        """)
        low_stock_items = cursor.fetchall()
        
        # Get expiring medications (within 30 days)
        cursor.execute("""
            SELECT 
                i.id,
                m.name,
                i.quantity,
                m.expiry_date,
                m.unit,
                DATEDIFF(m.expiry_date, CURDATE()) as days_until_expiry
            FROM inventory i
            JOIN medications m ON i.medication_id = m.id
            WHERE m.expiry_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 30 DAY)
            ORDER BY m.expiry_date ASC
            LIMIT 10
        """)
        expiring_items = cursor.fetchall()
        
        # Get recent stock movements
        cursor.execute("""
            SELECT 
                t.id,
                m.name,
                t.transaction_type,
                t.quantity,
                m.unit,
                t.created_at
            FROM inventory_transactions t
            JOIN inventory i ON t.inventory_id = i.id
            JOIN medications m ON i.medication_id = m.id
            ORDER BY t.created_at DESC
            LIMIT 10
        """)
        recent_movements = cursor.fetchall()
        
        # Get top items by quantity
        cursor.execute("""
            SELECT 
                i.id,
                m.name,
                i.quantity,
                m.price,
                m.unit,
                i.last_restocked_at
            FROM inventory i
            JOIN medications m ON i.medication_id = m.id
            ORDER BY i.quantity DESC
            LIMIT 10
        """)
        top_items = cursor.fetchall()

        # Get category analysis
        cursor.execute("""
            SELECT 
                CASE 
                    WHEN LOWER(m.name) LIKE '%tablet%' OR LOWER(m.name) LIKE '%cap%' THEN 'Tablets & Capsules'
                    WHEN LOWER(m.name) LIKE '%syrup%' OR LOWER(m.name) LIKE '%liquid%' THEN 'Liquids & Syrups'
                    WHEN LOWER(m.name) LIKE '%cream%' OR LOWER(m.name) LIKE '%ointment%' THEN 'Topicals'
                    WHEN LOWER(m.name) LIKE '%inject%' OR LOWER(m.name) LIKE '%ampoule%' THEN 'Injections'
                    ELSE 'Other'
                END as category,
                COUNT(*) as count,
                COALESCE(SUM(i.quantity * COALESCE(m.price, 0)), 0) as value
            FROM inventory i
            JOIN medications m ON i.medication_id = m.id
            GROUP BY 
                CASE 
                    WHEN LOWER(m.name) LIKE '%tablet%' OR LOWER(m.name) LIKE '%cap%' THEN 'Tablets & Capsules'
                    WHEN LOWER(m.name) LIKE '%syrup%' OR LOWER(m.name) LIKE '%liquid%' THEN 'Liquids & Syrups'
                    WHEN LOWER(m.name) LIKE '%cream%' OR LOWER(m.name) LIKE '%ointment%' THEN 'Topicals'
                    WHEN LOWER(m.name) LIKE '%inject%' OR LOWER(m.name) LIKE '%ampoule%' THEN 'Injections'
                    ELSE 'Other'
                END
        """)
        categories = cursor.fetchall()
        
        # Format the response
        analytics = {
            'inventory': {
                'totalItems': totals['total_items'] or 0,
                'lowStockCount': len(low_stock_items),
                'expiringCount': len(expiring_items),
                'totalValue': float(totals['total_value'] or 0),
                'categories': [{
                    'name': cat['category'],
                    'count': cat['count'],
                    'value': float(cat['value'] or 0)
                } for cat in categories]
            },
            'stockMovements': {
                'lowStockAlerts': [{
                    'id': item['id'],
                    'name': item['name'],
                    'quantity': item['quantity'],
                    'unit': item['unit'],
                    'reorderPoint': item['reorder_point'],
                    'lastRestocked': item['last_restocked_at'].isoformat() if item['last_restocked_at'] else None
                } for item in low_stock_items],
                'recentMovements': [{
                    'id': item['id'],
                    'name': item['name'],
                    'type': item['transaction_type'],
                    'quantity': item['quantity'],
                    'unit': item['unit'],
                    'date': item['created_at'].isoformat()
                } for item in recent_movements]
            },
            'expiryAnalysis': {
                'expiringSoon': [{
                    'id': item['id'],
                    'name': item['name'],
                    'quantity': item['quantity'],
                    'unit': item['unit'],
                    'expiryDate': item['expiry_date'].isoformat() if item['expiry_date'] else None,
                    'daysUntilExpiry': item['days_until_expiry']
                } for item in expiring_items]
            },
            'valueAnalysis': {
                'topItems': [{
                    'id': item['id'],
                    'name': item['name'],
                    'quantity': item['quantity'],
                    'unit': item['unit'],
                    'totalValue': float(item['quantity'] * (item['price'] or 0)),
                    'lastRestocked': item['last_restocked_at'].isoformat() if item['last_restocked_at'] else None
                } for item in top_items]
            }
        }
        
        return jsonify(analytics)
        
    except Exception as e:
        logger.error(f"Error getting inventory analytics: {str(e)}")
        logger.error(traceback.format_exc())
        return jsonify({'error': 'Internal server error'}), 500
    finally:
        if cursor:
            try:
                cursor.close()
            except:
                pass

if __name__ == '__main__':
    # Initialize the system when the app starts
    with app.app_context():
        initialize_system()
    try:
        app.run(host='127.0.0.1', port=5001, debug=True)
    finally:
        if db_manager:
            db_manager.close()