"""
Main application module for the AI-Assisted Medicine Prescription System.
This module integrates all components and provides the main interface.
"""

import logging
from pathlib import Path
from typing import Dict, List, Optional, Tuple
from datetime import datetime, date
from flask import Flask, jsonify, request, send_from_directory, session
from flask_cors import CORS
import os
import re
import uuid
import json
import mysql.connector
from mysql.connector import Error
from dotenv import load_dotenv

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
     methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
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
    global prescription_system, db_manager
    prescription_system = PrescriptionSystem()
    db_manager = DatabaseManager()

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
def analyze_symptoms():
    log_request_user('analyze_symptoms')
    """Analyze symptoms and return disease predictions with medication recommendations."""
    try:
        def find_medication_id_by_name(name):
            for med_id, med in prescription_system.inventory.inventory.items():
                if med['name'].lower() == name.lower():
                    return med_id
            return None
        data = request.get_json()
        description = data.get('description', '')
        # Retrieve patient_id from session instead of request body
        patient_id = session.get('user_id')
        if not patient_id:
            return jsonify({'error': 'Authentication required. Please log in.'}), 401
        # Use session values if not provided in request
        name = data.get('name') or session.get('name')
        dob = data.get('dob') or session.get('dob')
        age = data.get('age') or session.get('age')
        
        if not description:
            return jsonify({'error': 'No symptom description provided'}), 400
            
        # Initialize components if not already done
        if not prescription_system:
            initialize_system()
            
        # Get disease predictions
        predictor = DiseasePredictorTester(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'model', 'disease_predictor.pkl'))
        predictor.load_model()
        
        # Extract symptoms using the improved method
        symptoms = extract_symptoms_from_description(description)
        if not symptoms:
            return jsonify({'error': 'No symptoms detected in the description'}), 400
        
        # Get patient history if patient_id is provided
        patient_history = None
        if patient_id:
            patient_history = prescription_system.patient_history.get_patient_record(patient_id)
            if not patient_history:
                # Explicitly require name for new patient records
                if not name:
                    return jsonify({'error': 'name is required for new patient records'}), 400
                if not dob or not age:
                    return jsonify({'error': 'dob and age are required for new patient records'}), 400
                personal_info = {
                    'name': name,
                    'dob': dob,
                    'age': age,
                    'role': session.get('role', 'patient')
                }
                success = prescription_system.create_patient(patient_id, personal_info)
                if success:
                    patient_history = prescription_system.patient_history.get_patient_record(patient_id)
                    logger.info(f"Created new patient record for ID: {patient_id}")
                else:
                    logger.warning(f"Failed to create patient record for ID: {patient_id}")
            
            if patient_history:
                # Add to symptom history if patient exists
                prescription_system.patient_history.add_symptom_history(patient_id, symptoms)
            else:
                logger.warning(f"Patient record not found for ID: {patient_id}")
        
        # Get disease predictions using the extracted symptoms
        detected_symptoms, disease_preds = predictor.predict_from_text(' '.join(symptoms))
        
        # Filter predictions by confidence threshold and take top N
        filtered_preds = [(d, conf) for d, conf in disease_preds if conf >= MIN_DISEASE_CONFIDENCE]
        filtered_preds = filtered_preds[:TOP_N_DISEASES]
        
        if not filtered_preds:
            return jsonify({
                'error': 'No diseases predicted with sufficient confidence',
                'symptoms': symptoms
            }), 400
            
        # Get medication recommendations for each predicted disease
        recommendations = []
        created_prescriptions = []
        added_medications = []  # Track medications added to inventory
        
        for disease, confidence in filtered_preds:
            meds = prescription_system.medication_recommender.get_medication_recommendations(disease)
            # Filter medications based on patient history
            meds = filter_medications_by_history(meds, patient_history)
            
            if meds:
                med_recommendations = []
                for med in meds[:5]:  # Limit to top 5 medications
                    med_info = {
                        'name': med.get('name', 'Unknown'),
                        'generic_name': med.get('generic_name', 'Unknown'),
                        'dosage': med.get('dosage'),
                        'instructions': med.get('instructions')
                    }
                    med_recommendations.append(med_info)
                    
                    # Check if medication exists in inventory
                    medication_name = med.get('name')
                    if medication_name:
                        # Try to find medication by name
                        existing_med_id = find_medication_id_by_name(medication_name)
                        if existing_med_id:
                            medication_id = existing_med_id
                        else:
                            # Generate a new medication ID
                            medication_id = f"MED{len(prescription_system.inventory.inventory) + 1:03d}"
                            # Add medication to inventory with 0 stock
                            try:
                                success = prescription_system.inventory.add_medication(
                                    medication_id=medication_id,
                                    name=medication_name,
                                    quantity=0,  # Start with 0 stock
                                    unit="tablets",  # Default unit
                                    expiration_date="2025-12-31",  # Default expiration
                                    reorder_point=20,  # Default reorder point
                                    supplier="System Auto-Add"  # Indicate this was auto-added
                                )
                                if success:
                                    added_medications.append({
                                        'name': medication_name,
                                        'medication_id': medication_id,
                                        'status': 'added_to_inventory'
                                    })
                                    logger.info(f"Added new medication to inventory: {medication_name} (ID: {medication_id})")
                            except Exception as e:
                                logger.error(f"Failed to add medication to inventory: {str(e)}")
                                continue

                        # Create prescription for the medication
                        try:
                            prescription = {
                                'id': str(uuid.uuid4()),
                                'medication': medication_name,
                                'dosage': med.get('dosage', 'As prescribed'),
                                'frequency': med.get('frequency', 'twice daily'),
                                'duration': med.get('duration', '5 days'),
                                'quantity': 10,  # Default quantity
                                'status': 'pending'  # Default status
                            }
                            
                            success = prescription_system.create_prescription(
                                patient_id=patient_id,
                                medication=medication_name,
                                dosage=prescription['dosage'],
                                frequency=prescription['frequency'],
                                duration=prescription['duration'],
                                quantity=prescription['quantity'],
                                status=prescription['status']
                            )
                            
                            if success:
                                created_prescriptions.append(prescription)
                                logger.info(f"Created prescription for {medication_name}")
                            else:
                                logger.warning(f"Failed to create prescription for {medication_name}")
                                
                        except Exception as e:
                            logger.error(f"Error creating prescription: {str(e)}")
                            continue
                
                recommendations.append({
                    'disease': disease,
                    'confidence': confidence,
                    'medications': med_recommendations
                })
            else:
                recommendations.append({
                    'disease': disease,
                    'confidence': confidence,
                    'medications': [],
                    'message': 'No medication recommendations found for this disease. Please consult a healthcare professional for further evaluation.'
                })
        
        response = {
            'symptoms': symptoms,
            'predictions': filtered_preds,
            'recommendations': recommendations
        }
        
        if created_prescriptions:
            response['created_prescriptions'] = created_prescriptions
            
        if added_medications:
            response['added_medications'] = added_medications
            
        return jsonify(response)
        
    except Exception as e:
        logger.error(f"Error analyzing symptoms: {str(e)}")
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
            'last_updated': record['updated_at']
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
            
        # Set session data
        session['user_id'] = user['id']
        session['role'] = user['role']
        session['name'] = user['name']
        session['email'] = email
        session.permanent = True  # Make the session persistent
        
        # Handle DOB conversion
        try:
            if isinstance(user['dob'], date):
                session['dob'] = user['dob'].strftime('%Y-%m-%d')
            else:
                session['dob'] = str(user['dob'])
            logger.info(f"Processed DOB for session: {session['dob']}")
        except Exception as e:
            logger.error(f"Error processing DOB for login session: {str(e)}")
            session['dob'] = None
        
        # Calculate age from dob
        try:
            if session['dob']:
                dob_date = datetime.strptime(session['dob'], '%Y-%m-%d')
                today = datetime.today()
                age = today.year - dob_date.year - ((today.month, today.day) < (dob_date.month, dob_date.day))
                session['age'] = age
                logger.info(f"Calculated age for session: {age}")
            else:
                 session['age'] = None
                 logger.warning("DOB not available in session to calculate age.")

        except Exception as e:
            logger.error(f"Error calculating age for login session: {str(e)}")
            session['age'] = None
        
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
                'role': user['role']
            }
        })

        # Manually add the Set-Cookie header for the session
        # This uses Flask's session interface to serialize the session and create the header
        app.session_interface.save_session(app, session, response)

        # Log response headers before returning (will include Set-Cookie if successful)
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
            return jsonify({'error': 'Unauthorized - doctor access required'}), 403

        # Get the prescription
        prescription = prescription_system.get_prescription(prescription_id)
        if not prescription:
            return jsonify({'error': 'Prescription not found'}), 404

        # Update prescription status
        patient_id = prescription['patient_id']
        record = prescription_system.patient_history.get_patient_record(patient_id)
        if not record:
            return jsonify({'error': 'Patient record not found'}), 404

        # Find and update the prescription
        found = False
        for p in record['prescriptions']:
            if p.get('id') == prescription_id:
                p['status'] = 'approved'
                p['approved_at'] = datetime.now().isoformat()
                p['approved_by'] = session['user_id']
                found = True
                break
        if not found:
            return jsonify({'error': 'Prescription not found in patient record'}), 404

        # Save the updated record
        hashed_id = prescription_system.patient_history._hash_patient_id(patient_id)
        patient_file = prescription_system.patient_history._get_patient_file(hashed_id)
        with open(patient_file, 'w') as f:
            json.dump(record, f, indent=2)

        return jsonify({'message': 'Prescription approved successfully'})

    except Exception as e:
        logger.error(f"Error approving prescription: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/prescriptions/approved', methods=['GET'])
def get_approved_prescriptions():
    """Get all approved prescriptions that need pharmacist dispensing."""
    try:
        # Check if user is a pharmacist
        if session.get('role') != 'pharmacist':
            return jsonify({'error': 'Only pharmacists can view approved prescriptions'}), 403
            
        approved_prescriptions = prescription_system.get_approved_prescriptions()
        return jsonify(approved_prescriptions)
    except Exception as e:
        logger.error(f"Error getting approved prescriptions: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/prescriptions/<prescription_id>/dispense', methods=['POST'])
def dispense_prescription(prescription_id):
    """Dispense a prescription (pharmacist only)."""
    try:
        # Check if user is a pharmacist
        if session.get('role') != 'pharmacist':
            return jsonify({'error': 'Only pharmacists can dispense prescriptions'}), 403
        
        # Check if prescription exists
        prescription = prescription_system.get_prescription(prescription_id)
        if not prescription:
            return jsonify({'error': 'Prescription not found'}), 404
        
        medication_id = prescription.get('medication_id')
        quantity = prescription.get('quantity')
        
        # If medication_id is missing, try to infer it and update the prescription
        if not medication_id:
            med_name = prescription.get('medication')
            if med_name:
                for mid, med in prescription_system.inventory.inventory.items():
                    if med.get('name', '').lower() == med_name.lower():
                        medication_id = mid
                        # Patch the prescription in the patient record
                        prescription_system.update_prescription(prescription_id, {'medication_id': medication_id})
                        break
        # Re-fetch the prescription to ensure medication_id is present
        prescription = prescription_system.get_prescription(prescription_id)
        medication_id = prescription.get('medication_id')
        quantity = prescription.get('quantity')
        if not medication_id:
            return jsonify({'error': 'No medication_id found for this prescription'}), 400
        
        # Check inventory
        if not prescription_system.check_stock(medication_id, quantity):
            return jsonify({'error': 'Insufficient stock'}), 400
        
        # Update prescription status and reduce inventory
        success = prescription_system.dispense_prescription(prescription_id)
        if success:
            return jsonify({'message': 'Prescription dispensed successfully'})
        else:
            return jsonify({'error': 'Failed to dispense prescription'}), 400
    except Exception as e:
        logger.error(f"Error dispensing prescription: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/prescriptions', methods=['GET'])
def get_all_prescriptions():
    """Get all prescriptions with optional filtering."""
    try:
        # Get query parameters
        status = request.args.get('status')
        patient_id = request.args.get('patient_id')
        
        # Get prescriptions based on filters
        if status:
            if status == 'pending':
                prescriptions = prescription_system.get_pending_prescriptions()
            elif status == 'approved':
                prescriptions = prescription_system.get_approved_prescriptions()
            else:
                prescriptions = prescription_system.get_prescriptions_by_status(status)
        elif patient_id:
            prescriptions = prescription_system.get_patient_prescriptions(patient_id)
        else:
            prescriptions = prescription_system.get_all_prescriptions()
            
        return jsonify(prescriptions)
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
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 403
        
    # Check if user has permission (doctor or pharmacist)
    if session.get('role') not in ['doctor', 'pharmacist']:
        return jsonify({'error': 'Only doctors and pharmacists can update prescriptions'}), 403
        
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400
        
    # Get current prescription
    current = prescription_system.get_prescription(prescription_id)
    if not current:
        return jsonify({'error': 'Prescription not found'}), 404
        
    # Validate fields that can be updated
    allowed_fields = {
        'dosage': str,
        'frequency': str,
        'duration': str,
        'quantity': int,
        'instructions': str,
        'notes': str
    }
    
    # Filter and validate updates
    updates = {}
    for field, value in data.items():
        if field in allowed_fields:
            if not isinstance(value, allowed_fields[field]):
                return jsonify({'error': f'Invalid type for {field}. Expected {allowed_fields[field].__name__}'}), 400
            updates[field] = value
            
    if not updates:
        return jsonify({'error': 'No valid fields to update'}), 400
        
    # Update the prescription
    success = prescription_system.update_prescription(prescription_id, updates)
    if not success:
        return jsonify({'error': 'Failed to update prescription'}), 500
        
    # Return the updated prescription
    updated = prescription_system.get_prescription(prescription_id)
    return jsonify({
        'message': 'Prescription updated successfully',
        'prescription': updated
    }), 200

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
    try:
        # Get query parameters
        page = int(request.args.get('page', 1))
        search = request.args.get('search', '')
        per_page = 10
        offset = (page - 1) * per_page

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
        cursor = db_manager.conn.cursor(dictionary=True)
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
        return jsonify({'error': 'Internal server error'}), 500

def calculate_age(dob):
    """Calculate age from date of birth."""
    if not dob:
        return None
    today = datetime.today()
    return today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))

class PrescriptionSystem:
    def __init__(self, data_dir: str = "data/processed"):
        """Initialize the prescription system."""
        self.data_dir = Path(data_dir)
        self.data_dir.mkdir(parents=True, exist_ok=True)
        logger.info(f"PrescriptionSystem using data directory: {self.data_dir.resolve()}")
        
        # Initialize components
        self.medication_recommender = MedicationRecommender(data_dir)
        self.patient_history = PatientHistoryManager()  # No data_dir parameter needed
        self.inventory = InventoryManager(data_dir)
        self.security = SecurityManager(data_dir)
        self.sync = DataSyncManager(data_dir)
        
        # Start data synchronization
        self.sync.start_sync()
        
        # Set up update handlers
        self._setup_update_handlers()
        
    def _setup_update_handlers(self):
        """Set up handlers for different types of updates."""
        self.sync.subscribe("inventory", self._handle_inventory_update)
        self.sync.subscribe("patient_data", self._handle_patient_update)
        self.sync.subscribe("prescription", self._handle_prescription_update)
        
    def _handle_inventory_update(self, update: Dict):
        """Handle inventory-related updates."""
        try:
            action = update['data'].get('action')
            if action == 'low_stock':
                logger.warning(f"Low stock alert for medication: {update['data']['medication_id']}")
            elif action == 'expiring':
                logger.warning(f"Expiring medication alert: {update['data']['medication_id']}")
        except Exception as e:
            logger.error(f"Error handling inventory update: {str(e)}")
            
    def _handle_patient_update(self, update: Dict):
        """Handle patient data updates."""
        try:
            action = update['data'].get('action')
            if action == 'new_record':
                logger.info(f"New patient record created: {update['data']['patient_id']}")
            elif action == 'update':
                logger.info(f"Patient record updated: {update['data']['patient_id']}")
        except Exception as e:
            logger.error(f"Error handling patient update: {str(e)}")
            
    def _handle_prescription_update(self, update: Dict):
        """Handle prescription-related updates."""
        try:
            action = update['data'].get('action')
            if action == 'new':
                presc_id = update['data'].get('prescription_id')
                if presc_id:
                    logger.info(f"New prescription created: {presc_id}")
                else:
                    logger.warning(f"New prescription update missing 'prescription_id': {update['data']}")
            elif action == 'filled':
                presc_id = update['data'].get('prescription_id')
                if presc_id:
                    logger.info(f"Prescription filled: {presc_id}")
                else:
                    logger.warning(f"Filled prescription update missing 'prescription_id': {update['data']}")
        except Exception as e:
            logger.error(f"Error handling prescription update: {str(e)}")
            
    def create_patient(self,
                      patient_id: str,
                      personal_info: Dict,
                      initial_history: Dict = None) -> bool:
        """Create a new patient record."""
        try:
            success = self.patient_history.create_patient_record(
                patient_id,
                personal_info,
                initial_history
            )
            
            if success:
                self.sync.publish_update(
                    "patient_data",
                    {
                        "action": "new_record",
                        "patient_id": patient_id
                    }
                )
                
            return success
            
        except Exception as e:
            logger.error(f"Error creating patient: {str(e)}")
            return False
            
    def get_medication_recommendations(self,
                                     patient_id: str,
                                     symptoms: List[str]) -> Tuple[List[Dict], List[Dict]]:
        """
        Get medication recommendations for a patient.
        
        Returns:
            Tuple of (recommendations, interactions)
        """
        try:
            # Get patient record
            patient_record = self.patient_history.get_patient_record(patient_id)
            if not patient_record:
                return [], []
                
            # Get disease prediction (placeholder - implement actual prediction)
            disease = "influenza"  # This should come from your disease prediction model
            
            # Get recommendations
            recommendations = self.medication_recommender.get_medication_recommendations(
                disease=disease,
                patient_history=patient_record['medical_history'],
                allergies=set(patient_record['allergies'])
            )
            
            # Check for interactions
            current_meds = [p['medication'] for p in patient_record['prescriptions']]
            new_meds = [r['name'] for r in recommendations]
            
            interactions = self.medication_recommender.check_drug_interactions(
                medications=new_meds,
                patient_medications=current_meds
            )
            
            return recommendations, interactions
            
        except Exception as e:
            logger.error(f"Error getting medication recommendations: {str(e)}")
            return [], []
            
    def create_prescription(self,
                          patient_id: str,
                          medication: str,
                          dosage: str,
                          frequency: str,
                          duration: str,
                          quantity: int,
                          status: str = 'pending') -> bool:
        """Create a new prescription."""
        try:
            # Create prescription
            prescription = {
                "id": str(uuid.uuid4()),
                "medication": medication,
                "dosage": dosage,
                "frequency": frequency,
                "duration": duration,
                "quantity": quantity,
                "prescribed_at": datetime.now().isoformat(),
                "status": status
            }
            # Add to patient history
            success = self.patient_history.add_prescription(patient_id, prescription)
            if not success:
                return False
            # Publish update
            self.sync.publish_update(
                "prescription",
                {
                    "action": "new",
                    "patient_id": patient_id,
                    "prescription_id": prescription["id"],
                    "medication": medication,
                    "quantity": quantity
                }
            )
            return True
        except Exception as e:
            logger.error(f"Error creating prescription: {str(e)}")
            return False
            
    def get_patient_history(self,
                          patient_id: str,
                          start_date: Optional[str] = None,
                          end_date: Optional[str] = None) -> Dict:
        """Get patient's medical history and prescriptions."""
        try:
            record = self.patient_history.get_patient_record(patient_id)
            if not record:
                return {}
                
            prescriptions = self.patient_history.get_prescription_history(
                patient_id,
                start_date,
                end_date
            )
            
            return {
                "personal_info": record['personal_info'],
                "medical_history": record['medical_history'],
                "allergies": record['medical_history'].get('allergies', []),
                "conditions": record['medical_history'].get('conditions', []),
                "prescriptions": prescriptions
            }
        except Exception as e:
            logger.error(f"Error getting patient history: {str(e)}")
            return {}
            
    def get_inventory_status(self) -> Dict:
        """Get current inventory status."""
        try:
            return {
                "low_stock": self.inventory.get_low_stock_items(),
                "expiring": self.inventory.get_expiring_medications(),
                "report": self.inventory.generate_inventory_report()
            }
        except Exception as e:
            logger.error(f"Error getting inventory status: {str(e)}")
            return {}
            
    def shutdown(self):
        """Shutdown the system."""
        try:
            self.sync.stop_sync()
            logger.info("System shutdown complete")
        except Exception as e:
            logger.error(f"Error during shutdown: {str(e)}")
            
    def __enter__(self):
        """Context manager entry."""
        return self
        
    def __exit__(self, exc_type, exc_val, exc_tb):
        """Context manager exit."""
        self.shutdown()

    def get_pending_prescriptions(self) -> List[Dict]:
        """Get all prescriptions with pending status."""
        try:
            pending_prescriptions = []
            patient_records = self.patient_history.get_all_patient_records()
            for record in patient_records:
                patient_id = record['patient_id']
                for prescription in record.get('prescriptions', []):
                    if prescription.get('status') == 'pending':
                        prescription['patient_id'] = patient_id
                        pending_prescriptions.append(prescription)
            return pending_prescriptions
        except Exception as e:
            logger.error(f"Error getting pending prescriptions: {str(e)}")
            return []

    def get_approved_prescriptions(self) -> List[Dict]:
        """Get all prescriptions with approved status."""
        try:
            approved_prescriptions = []
            patient_records = self.patient_history.get_all_patient_records()
            for record in patient_records:
                patient_id = record['patient_id']
                for prescription in record.get('prescriptions', []):
                    if prescription.get('status') == 'approved':
                        prescription['patient_id'] = patient_id
                        approved_prescriptions.append(prescription)
            return approved_prescriptions
        except Exception as e:
            logger.error(f"Error getting approved prescriptions: {str(e)}")
            return []

    def get_prescription(self, prescription_id: str) -> Optional[Dict]:
        """Get a specific prescription by ID."""
        try:
            patient_records = self.patient_history.get_all_patient_records()
            for record in patient_records:
                for prescription in record.get('prescriptions', []):
                    if prescription.get('id') == prescription_id:
                        prescription['patient_id'] = record['patient_id']
                        return prescription
            return None
        except Exception as e:
            logger.error(f"Error getting prescription: {str(e)}")
            return None

    def update_prescription(self, prescription_id: str, modifications: Dict) -> bool:
        """Update a prescription with new details."""
        try:
            patient_records = self.patient_history.get_all_patient_records()
            for record in patient_records:
                updated = False
                for prescription in record.get('prescriptions', []):
                    if prescription.get('id') == prescription_id:
                        prescription.update(modifications)
                        updated = True
                        break
                if updated:
                    # Save the updated record
                    hashed_id = self.patient_history._hash_patient_id(record['patient_id'])
                    patient_file = self.patient_history._get_patient_file(hashed_id)
                    with open(patient_file, 'w') as f:
                        json.dump(record, f, indent=2)
                    return True
            return False
        except Exception as e:
            logger.error(f"Error updating prescription: {str(e)}")
            return False

    def dispense_prescription(self, prescription_id: str) -> bool:
        """Dispense a prescription and update inventory."""
        try:
            patient_records = self.patient_history.get_all_patient_records()
            for record in patient_records:
                dispensed = False
                for prescription in record.get('prescriptions', []):
                    if prescription.get('id') == prescription_id:
                        # Update prescription status
                        prescription['status'] = 'completed'
                        # Ensure medication_id exists
                        medication_id = prescription.get('medication_id')
                        if not medication_id:
                            # Try to infer medication_id from medication name
                            med_name = prescription.get('medication')
                            if med_name:
                                for mid, med in self.inventory.inventory.items():
                                    if med.get('name', '').lower() == med_name.lower():
                                        medication_id = mid
                                        prescription['medication_id'] = medication_id
                                        break
                        if not medication_id:
                            logger.error(f"No medication_id found for prescription {prescription_id}")
                            return False
                        quantity = prescription.get('quantity')
                        if medication_id and quantity:
                            # Use the PrescriptionSystem's check_stock method instead of InventoryManager's
                            if not self.check_stock(medication_id, quantity):
                                logger.error(f"Insufficient stock for prescription {prescription_id}")
                                return False
                            self.inventory.update_stock(medication_id, -quantity)
                            self.inventory.add_transaction(
                                inventory_id=medication_id,
                                transaction_type='dispense',
                                quantity=quantity,
                                reference_id=prescription_id,
                                notes=f'Dispensed for prescription {prescription_id}'
                            )
                        dispensed = True
                        break
                if dispensed:
                    # Save the updated record
                    hashed_id = self.patient_history._hash_patient_id(record['patient_id'])
                    patient_file = self.patient_history._get_patient_file(hashed_id)
                    with open(patient_file, 'w') as f:
                        json.dump(record, f, indent=2)
                    return True
            return False
        except Exception as e:
            logger.error(f"Error dispensing prescription: {str(e)}")
            return False

    def get_all_prescriptions(self) -> List[Dict]:
        """Get all prescriptions."""
        try:
            all_prescriptions = []
            patient_records = self.patient_history.get_all_patient_records()
            for record in patient_records:
                patient_id = record['patient_id']
                for prescription in record.get('prescriptions', []):
                    prescription['patient_id'] = patient_id
                    all_prescriptions.append(prescription)
            return all_prescriptions
        except Exception as e:
            logger.error(f"Error getting all prescriptions: {str(e)}")
            return []

    def get_prescriptions_by_status(self, status: str) -> List[Dict]:
        """Get all prescriptions with a specific status."""
        try:
            status_prescriptions = []
            patient_records = self.patient_history.get_all_patient_records()
            for record in patient_records:
                patient_id = record['patient_id']
                for prescription in record.get('prescriptions', []):
                    if prescription.get('status') == status:
                        prescription['patient_id'] = patient_id
                        status_prescriptions.append(prescription)
            return status_prescriptions
        except Exception as e:
            logger.error(f"Error getting prescriptions by status: {str(e)}")
            return []

    def get_patient_prescriptions(self, patient_id: str) -> List[Dict]:
        """Get all prescriptions for a specific patient."""
        try:
            record = self.patient_history.get_record(patient_id)
            if not record:
                return []
            
            prescriptions = record.get('prescriptions', [])
            for prescription in prescriptions:
                prescription['patient_id'] = patient_id
            return prescriptions
        except Exception as e:
            logger.error(f"Error getting patient prescriptions: {str(e)}")
            return []

    def check_stock(self, medication_id: str, quantity: int) -> bool:
        """Return True if medication exists and has enough stock, else False."""
        try:
            if medication_id not in self.inventory.inventory:
                logger.warning(f"Medication {medication_id} not found in inventory.")
                return False
            current_quantity = self.inventory.inventory[medication_id]['quantity']
            if current_quantity < quantity:
                logger.warning(f"Insufficient stock for {medication_id}: requested {quantity}, available {current_quantity}")
                return False
            return True
        except Exception as e:
            logger.error(f"Error in check_stock: {str(e)}")
            return False

class DatabaseManager:
    def __init__(self):
        """Initialize database connection."""
        try:
            # Connect to the MySQL server and database
            logger.info("Attempting to connect to MySQL server...")
            self.conn = mysql.connector.connect(
                host=os.getenv('MYSQL_DATABASE_HOST'),
                user=os.getenv('MYSQL_DATABASE_USER'),
                password=os.getenv('MYSQL_DATABASE_PASSWORD'),
                database=os.getenv('MYSQL_DATABASE_DB'),
                port=int(os.getenv('MYSQL_DATABASE_PORT', '3306'))
            )
            self.cursor = self.conn.cursor()
            
            # Read and execute schema.sql (will not overwrite existing tables)
            schema_path = os.path.join(os.path.dirname(__file__), 'schema.sql')
            logger.info(f"Reading schema from: {schema_path}")
            with open(schema_path, 'r') as f:
                schema_sql = f.read()
                
            # Split and execute each SQL command
            logger.info("Executing database schema...")
            for command in schema_sql.split(';'):
                if command.strip():
                    try:
                        self.cursor.execute(command)
                        if 'CREATE TABLE' in command.upper():
                            table_name = command.split('CREATE TABLE')[1].split('(')[0].strip()
                            logger.info(f"Table '{table_name}' created successfully")
                    except Error as e:
                        if 'table exists' in str(e).lower():
                            table_name = command.split('CREATE TABLE')[1].split('(')[0].strip()
                            logger.info(f"Table '{table_name}' already exists")
                        else:
                            raise
            
            self.conn.commit()
            logger.info("Schema execution completed")
            logger.info("Database connection established successfully")
            
        except Error as e:
            logger.error(f"Error connecting to database: {e}")
            raise

    def create_user(self, user_id: str, email: str, password: str, name: str, role: str, dob: str, gender: str) -> bool:
        """Create a new user in the database."""
        try:
            logger.info(f"Attempting to create user with email: {email}")
            query = """
                INSERT INTO users (id, name, email, password, dob, role, gender)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
            """
            params = (user_id, name, email, password, dob, role, gender)
            logger.info(f"Query parameters: {params}")
            logger.info("Executing user creation query...")
            with self.conn.cursor() as cursor:
                cursor.execute(query, params)
            self.conn.commit()
            logger.info(f"Successfully created user with ID: {user_id}")
            return True
        except Error as e:
            import traceback
            logger.error(f"Error creating user: {str(e)}\n{traceback.format_exc()}")
            logger.error(f"Query: {query}")
            logger.error(f"Parameters: {params}")
            return False

    def get_user_by_email(self, email: str) -> Optional[Dict]:
        """Get user by email from the database."""
        try:
            if not self.conn or not self.conn.is_connected():
                self.connect()
                
            query = "SELECT * FROM users WHERE email = %s"
            cursor = self.conn.cursor(dictionary=True)
            cursor.execute(query, (email,))
            user = cursor.fetchone()
            cursor.close()
            
            if user:
                # Convert date objects to strings for JSON serialization
                if user.get('dob'):
                    if isinstance(user['dob'], date):
                        user['dob'] = user['dob'].strftime('%Y-%m-%d')
                        
            return user
        except Exception as e:
            logger.error(f"Error getting user by email: {str(e)}")
            import traceback
            logger.error(f"Traceback: {traceback.format_exc()}")
            return None

    def close(self):
        """Close the database connection."""
        if hasattr(self, 'conn') and self.conn.is_connected():
            self.conn.close()
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

if __name__ == '__main__':
    # Initialize the system when the app starts
    with app.app_context():
        initialize_system()
    try:
        app.run(host='127.0.0.1', port=5001, debug=True)
    finally:
        if db_manager:
            db_manager.close()