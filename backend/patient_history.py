"""
Patient history management module.
This module handles storing and retrieving patient medical history,
prescriptions, and other relevant information.
"""

import logging
from datetime import datetime
from typing import Dict, List, Optional
import mysql.connector
from mysql.connector import Error
import os
from dotenv import load_dotenv
import json
import hashlib
import uuid

# Configure logging
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

class PatientHistoryManager:
    def __init__(self, db_manager=None):
        """Initialize the patient history manager with database connection."""
        self.db_manager = db_manager
        self.conn = None

    def _get_connection(self):
        """Get a database connection."""
        if self.db_manager:
            return self.db_manager._get_connection()
        else:
            # Fallback to direct connection if no db_manager provided
            if not self.conn or not self.conn.is_connected():
                try:
                    self.conn = mysql.connector.connect(
                        host=os.getenv('MYSQL_DATABASE_HOST'),
                        user=os.getenv('MYSQL_DATABASE_USER'),
                        password=os.getenv('MYSQL_DATABASE_PASSWORD'),
                        database=os.getenv('MYSQL_DATABASE_DB'),
                        port=int(os.getenv('MYSQL_DATABASE_PORT', '3306'))
                    )
                    logger.info("Database connection established successfully")
                except Error as e:
                    logger.error(f"Error connecting to database: {e}")
                    raise
            return self.conn

    def _hash_patient_id(self, patient_id: str) -> str:
        """Hash patient ID for secure storage."""
        # Convert patient_id to string if it's not already
        patient_id_str = str(patient_id)
        return hashlib.sha256(patient_id_str.encode()).hexdigest()

    def create_patient_record(self, 
                            patient_id: str,
                            personal_info: Dict,
                            initial_history: Dict = None) -> bool:
        """
        Create a new patient record.
        
        Args:
            patient_id: Unique identifier for the patient
            personal_info: Dictionary containing patient's personal information
            initial_history: Optional initial medical history
            
        Returns:
            bool: True if successful, False otherwise
        """
        cursor = None
        conn = None
        try:
            conn = self._get_connection()
            cursor = conn.cursor(dictionary=True)
            
            # Validate required personal info fields
            required_fields = ['name', 'email', 'dob', 'gender']
            missing_fields = [field for field in required_fields if field not in personal_info]
            if missing_fields:
                logger.error(f"Missing required personal info fields: {missing_fields}")
                return False

            # Check if patient record already exists
            check_query = "SELECT id FROM patient_medical_history WHERE patient_id = %s"
            cursor.execute(check_query, (patient_id,))
            existing_record = cursor.fetchone()
            
            if existing_record:
                logger.info(f"Patient record already exists for ID: {patient_id}")
                return True

            # Insert into patient_medical_history with all required fields
            query = """
                INSERT INTO patient_medical_history 
                (patient_id, allergies, conditions, email, name, dob, gender, role)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            """
            allergies = json.dumps(initial_history.get('allergies', []) if initial_history else [])
            conditions = json.dumps(initial_history.get('conditions', []) if initial_history else [])
            
            cursor.execute(query, (
                patient_id,
                allergies,
                conditions,
                personal_info['email'],
                personal_info['name'],
                personal_info['dob'],
                personal_info['gender'],
                personal_info.get('role', 'patient')
            ))
            conn.commit()
            
            logger.info(f"Created patient record for ID: {patient_id}")
            return True
            
        except mysql.connector.Error as e:
            logger.error(f"Database error creating patient record: {str(e)}")
            conn.rollback()
            return False
        except json.JSONDecodeError as e:
            logger.error(f"JSON encoding error creating patient record: {str(e)}")
            conn.rollback()
            return False
        except Exception as e:
            logger.error(f"Unexpected error creating patient record: {str(e)}")
            conn.rollback()
            return False
        finally:
            if cursor:
                try:
                    cursor.close()
                except:
                    pass
            if conn and not self.db_manager:  # Only close if we created the connection
                try:
                    conn.close()
                except:
                    pass

    def get_patient_record(self, patient_id: str) -> Optional[Dict]:
        """Get a patient's complete record."""
        cursor = None
        conn = None
        try:
            conn = self._get_connection()
            if not conn:
                logger.error("Failed to get database connection")
                return None
                
            cursor = conn.cursor(dictionary=True)
            if not cursor:
                logger.error("Failed to create cursor")
                return None
            
            # Get user info
            user_query = "SELECT * FROM users WHERE id = %s"
            cursor.execute(user_query, (patient_id,))
            user = cursor.fetchone()
            
            if not user:
                logger.warning(f"No user found with ID: {patient_id}")
                return None
                
            # Get medical history
            history_query = "SELECT * FROM patient_medical_history WHERE patient_id = %s"
            cursor.execute(history_query, (patient_id,))
            history = cursor.fetchone()
            
            # Get prescriptions
            prescriptions_query = """
                SELECT p.*, m.name as medication_name 
                FROM prescriptions p 
                JOIN medications m ON p.medication_id = m.id 
                WHERE p.patient_id = %s
            """
            cursor.execute(prescriptions_query, (patient_id,))
            prescriptions = cursor.fetchall()
            
            # Get symptom history
            symptoms_query = "SELECT * FROM symptom_history WHERE patient_id = %s ORDER BY recorded_at DESC"
            cursor.execute(symptoms_query, (patient_id,))
            symptoms = cursor.fetchall()
            
            # Build complete record
            record = {
                'patient_id': patient_id,
                'personal_info': {
                    'name': user['name'],
                    'email': user['email'],
                    'dob': user['dob'].isoformat() if user.get('dob') else None,
                    'gender': user['gender'],
                    'role': user['role']
                },
                'medical_history': {
                    'allergies': json.loads(history.get('allergies', '[]')) if history and history.get('allergies') is not None else [],
                    'conditions': json.loads(history.get('conditions', '[]')) if history and history.get('conditions') is not None else []
                },
                'prescriptions': prescriptions,
                'symptom_history': symptoms,
                'created_at': user['created_at'].isoformat() if user.get('created_at') else None
            }
            
            return record
            
        except Error as e:
            logger.error(f"Error getting patient record: {str(e)}")
            return None
        except Exception as e:
            logger.error(f"Unexpected error getting patient record: {str(e)}")
            return None
        finally:
            if cursor:
                try:
                    cursor.close()
                except:
                    pass
            if conn and not self.db_manager:  # Only close if we created the connection
                try:
                    conn.close()
                except:
                    pass

    def update_medical_history(self,
                             patient_id: str,
                             new_history: Dict) -> bool:
        """
        Update a patient's medical history.
        
        Args:
            patient_id: Unique identifier for the patient
            new_history: Dictionary containing new medical history information
            
        Returns:
            bool: True if successful, False otherwise
        """
        try:
            record = self.get_patient_record(patient_id)
            if not record:
                return False
                
            record['medical_history'].update(new_history)
            
            hashed_id = self._hash_patient_id(patient_id)
            patient_file = self._get_patient_file(hashed_id)
            
            with open(patient_file, 'w') as f:
                json.dump(record, f, indent=2)
                
            logger.info(f"Updated medical history for patient ID: {patient_id}")
            return True
            
        except Exception as e:
            logger.error(f"Error updating medical history: {str(e)}")
            return False

    def add_prescription(self, patient_id: str, prescription: Dict) -> bool:
        """Add a new prescription to patient's record."""
        cursor = None
        conn = None
        try:
            # Validate required prescription fields
            required_fields = ['medication', 'dosage', 'frequency']
            missing_fields = [field for field in required_fields if field not in prescription]
            if missing_fields:
                logger.error(f"Missing required prescription fields: {missing_fields}")
                return False

            conn = self._get_connection()
            cursor = conn.cursor(dictionary=True)

            # Validate patient exists
            patient_query = "SELECT id FROM users WHERE id = %s"
            cursor.execute(patient_query, (patient_id,))
            if not cursor.fetchone():
                logger.error(f"Patient with ID {patient_id} does not exist")
                return False

            # First, ensure medication exists
            med_query = "SELECT id FROM medications WHERE name = %s"
            cursor.execute(med_query, (prescription['medication'],))
            med = cursor.fetchone()
            
            if not med:
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
                logger.info(f"Created new medication record for: {prescription['medication']}")
            else:
                med_id = med['id']
            
            # Generate a unique prescription ID
            prescription_id = str(uuid.uuid4())
            
            # Insert prescription
            query = """
                INSERT INTO prescriptions 
                (id, patient_id, medication_id, prescribed_by, dosage, frequency, 
                start_date, end_date, status, generic_name, notes)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """
            
            # Parse dates if provided
            start_date = prescription.get('start_date')
            if isinstance(start_date, str):
                start_date = datetime.strptime(start_date, '%Y-%m-%d').date()
            elif not start_date:
                start_date = datetime.now().date()
                
            end_date = prescription.get('end_date')
            if isinstance(end_date, str):
                end_date = datetime.strptime(end_date, '%Y-%m-%d').date()
            
            # Use system doctor ID as default prescriber
            SYSTEM_DOCTOR_ID = '5838be12-3b2b-40a3-8883-8f00b46fa2c7'
            prescribed_by = prescription.get('prescribed_by', SYSTEM_DOCTOR_ID)

            cursor.execute(query, (
                prescription_id,
                patient_id,
                med_id,
                prescribed_by,
                prescription['dosage'],
                prescription['frequency'],
                start_date,
                end_date,
                prescription.get('status', 'active'),
                prescription.get('generic_name', prescription['medication']),
                prescription.get('notes', '')
            ))
            
            conn.commit()
            logger.info(f"Added prescription {prescription_id} for patient ID: {patient_id}")
            return True
            
        except mysql.connector.Error as e:
            logger.error(f"Database error adding prescription: {str(e)}")
            if conn:
                conn.rollback()
            return False
        except ValueError as e:
            logger.error(f"Invalid date format in prescription: {str(e)}")
            if conn:
                conn.rollback()
            return False
        except Exception as e:
            logger.error(f"Unexpected error adding prescription: {str(e)}")
            if conn:
                conn.rollback()
            return False
        finally:
            if cursor:
                try:
                    cursor.close()
                except:
                    pass

    def update_allergies(self,
                        patient_id: str,
                        allergies: List[str]) -> bool:
        """
        Update patient's allergies list.
        
        Args:
            patient_id: Unique identifier for the patient
            allergies: List of allergies
            
        Returns:
            bool: True if successful, False otherwise
        """
        try:
            record = self.get_patient_record(patient_id)
            if not record:
                return False
                
            record['allergies'] = allergies
            
            hashed_id = self._hash_patient_id(patient_id)
            patient_file = self._get_patient_file(hashed_id)
            
            with open(patient_file, 'w') as f:
                json.dump(record, f, indent=2)
                
            logger.info(f"Updated allergies for patient ID: {patient_id}")
            return True
            
        except Exception as e:
            logger.error(f"Error updating allergies: {str(e)}")
            return False

    def get_prescription_history(self,
                               patient_id: str,
                               start_date: Optional[str] = None,
                               end_date: Optional[str] = None) -> List[Dict]:
        """Get patient's prescription history within a date range."""
        cursor = None
        conn = None
        try:
            conn = self._get_connection()
            cursor = conn.cursor(dictionary=True)
            
            query = """
                SELECT p.*, m.name as medication_name 
                FROM prescriptions p 
                JOIN medications m ON p.medication_id = m.id 
                WHERE p.patient_id = %s
            """
            params = [patient_id]
            
            if start_date:
                query += " AND p.created_at >= %s"
                params.append(start_date)
            if end_date:
                query += " AND p.created_at <= %s"
                params.append(end_date)
                
            query += " ORDER BY p.created_at DESC"
            
            cursor.execute(query, params)
            return cursor.fetchall()
            
        except Error as e:
            logger.error(f"Error retrieving prescription history: {str(e)}")
            return []
        finally:
            if cursor:
                try:
                    cursor.close()
                except:
                    pass

    def add_symptom_history(self, patient_id: str, symptoms: list, severity: str = 'moderate') -> bool:
        """Add a new symptom entry to the patient's symptom history."""
        cursor = None
        conn = None
        try:
            conn = self._get_connection()
            cursor = conn.cursor(dictionary=True)
            
            query = """
                INSERT INTO symptom_history 
                (patient_id, symptoms, severity)
                VALUES (%s, %s, %s)
            """
            cursor.execute(query, (patient_id, json.dumps(symptoms), severity))
            conn.commit()
            
            logger.info(f"Added symptom history for patient ID: {patient_id}")
            return True
            
        except Error as e:
            logger.error(f"Error adding symptom history: {str(e)}")
            if conn:
                conn.rollback()
            return False
        finally:
            if cursor:
                try:
                    cursor.close()
                except:
                    pass

    def get_all_patient_records(self, strip_sensitive: bool = False) -> List[Dict]:
        """
        Retrieve all patient records from the database.
        Args:
            strip_sensitive: If True, remove sensitive info from personal_info
        Returns:
            List of dictionaries containing patient records
        """
        cursor = None
        conn = None
        try:
            conn = self._get_connection()
            cursor = conn.cursor(dictionary=True)
            
            # Query to get all patient records with their medical history
            query = """
                SELECT 
                    u.id as patient_id,
                    u.name,
                    u.email,
                    u.dob,
                    u.gender,
                    u.role,
                    u.created_at,
                    pmh.allergies,
                    pmh.conditions,
                    p.id as prescription_id,
                    p.medication_id,
                    p.prescribed_by,
                    p.dosage,
                    p.frequency,
                    p.start_date,
                    p.end_date,
                    p.status,
                    p.notes,
                    m.name as medication_name,
                    m.generic_name,
                    m.description as medication_description
                FROM users u
                LEFT JOIN patient_medical_history pmh ON u.id = pmh.patient_id
                LEFT JOIN prescriptions p ON u.id = p.patient_id
                LEFT JOIN medications m ON p.medication_id = m.id
                WHERE u.role = 'patient'
                ORDER BY u.created_at DESC
            """
            
            cursor.execute(query)
            rows = cursor.fetchall()
            
            # Group records by patient
            patients = {}
            for row in rows:
                patient_id = row['patient_id']
                if patient_id not in patients:
                    # Create base patient record
                    patients[patient_id] = {
                        'patient_id': patient_id,
                        'personal_info': {
                            'name': row['name'],
                            'email': row['email'],
                            'dob': row['dob'].isoformat() if row['dob'] else None,
                            'gender': row['gender'],
                            'role': row['role']
                        },
                        'medical_history': {
                            'allergies': json.loads(row['allergies']) if row['allergies'] else [],
                            'conditions': json.loads(row['conditions']) if row['conditions'] else []
                        },
                        'prescriptions': [],
                        'created_at': row['created_at'].isoformat() if row['created_at'] else None
                    }
                    
                    if strip_sensitive:
                        patients[patient_id]['personal_info'] = {
                            'name': row['name'],
                            'role': row['role']
                        }
                
                # Add prescription if it exists
                if row['prescription_id']:
                    prescription = {
                        'id': row['prescription_id'],
                        'medication_id': row['medication_id'],
                        'medication_name': row['medication_name'],
                        'generic_name': row['generic_name'],
                        'dosage': row['dosage'],
                        'frequency': row['frequency'],
                        'start_date': row['start_date'].isoformat() if row['start_date'] else None,
                        'end_date': row['end_date'].isoformat() if row['end_date'] else None,
                        'status': row['status'],
                        'notes': row['notes'],
                        'description': row['medication_description']
                    }
                    patients[patient_id]['prescriptions'].append(prescription)
            
            return list(patients.values())
            
        except Exception as e:
            logger.error(f"Error retrieving all patient records: {str(e)}")
            return []
        finally:
            if cursor:
                try:
                    cursor.close()
                except:
                    pass

    def get_all_prescriptions(self) -> List[Dict]:
        """Get all prescriptions from the database."""
        cursor = None
        conn = None
        try:
            conn = self._get_connection()
            cursor = conn.cursor(dictionary=True)
            
            query = """
                SELECT p.*, m.name as medication_name, u.name as patient_name
                FROM prescriptions p
                JOIN medications m ON p.medication_id = m.id
                JOIN users u ON p.patient_id = u.id
                ORDER BY p.created_at DESC
            """
            cursor.execute(query)
            prescriptions = cursor.fetchall()
            logger.info(f"Retrieved {len(prescriptions)} all prescriptions from database.")
            return prescriptions
        except Error as e:
            logger.error(f"Database error retrieving all prescriptions: {str(e)}")
            return []
        finally:
            if cursor:
                try:
                    cursor.close()
                except:
                    pass

    def close(self):
        """Close the database connection."""
        try:
            if self.conn and not self.db_manager:  # Only close if we created the connection
                self.conn.close()
                self.conn = None
                logger.info("Database connection closed")
        except Error:
            pass