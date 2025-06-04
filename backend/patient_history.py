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

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

class PatientHistoryManager:
    def __init__(self):
        """Initialize the patient history manager with database connection."""
        try:
            self.conn = mysql.connector.connect(
                host=os.getenv('MYSQL_DATABASE_HOST'),
                user=os.getenv('MYSQL_DATABASE_USER'),
                password=os.getenv('MYSQL_DATABASE_PASSWORD'),
                database=os.getenv('MYSQL_DATABASE_DB'),
                port=int(os.getenv('MYSQL_DATABASE_PORT', '3306'))
            )
            self.cursor = self.conn.cursor(dictionary=True)
            logger.info("Database connection established successfully")
        except Error as e:
            logger.error(f"Error connecting to database: {e}")
            raise

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
        try:
            # Insert into patient_medical_history
            query = """
                INSERT INTO patient_medical_history 
                (patient_id, allergies, conditions)
                VALUES (%s, %s, %s)
            """
            allergies = json.dumps(initial_history.get('allergies', []) if initial_history else [])
            conditions = json.dumps(initial_history.get('conditions', []) if initial_history else [])
            
            self.cursor.execute(query, (patient_id, allergies, conditions))
            self.conn.commit()
            
            logger.info(f"Created patient record for ID: {patient_id}")
            return True
            
        except Error as e:
            logger.error(f"Error creating patient record: {str(e)}")
            return False

    def get_patient_record(self, patient_id: str) -> Optional[Dict]:
        """Get a patient's complete record."""
        try:
            # Get user info
            user_query = "SELECT * FROM users WHERE id = %s"
            self.cursor.execute(user_query, (patient_id,))
            user = self.cursor.fetchone()
            
            if not user:
                return None
                
            # Get medical history
            history_query = "SELECT * FROM patient_medical_history WHERE patient_id = %s"
            self.cursor.execute(history_query, (patient_id,))
            history = self.cursor.fetchone()
            
            # Get prescriptions
            prescriptions_query = """
                SELECT p.*, m.name as medication_name 
                FROM prescriptions p 
                JOIN medications m ON p.medication_id = m.id 
                WHERE p.patient_id = %s
            """
            self.cursor.execute(prescriptions_query, (patient_id,))
            prescriptions = self.cursor.fetchall()
            
            # Get symptom history
            symptoms_query = "SELECT * FROM symptom_history WHERE patient_id = %s ORDER BY recorded_at DESC"
            self.cursor.execute(symptoms_query, (patient_id,))
            symptoms = self.cursor.fetchall()
            
            # Build complete record
            record = {
                'patient_id': patient_id,
                'personal_info': {
                    'name': user['name'],
                    'email': user['email'],
                    'dob': user['dob'].isoformat(),
                    'gender': user['gender'],
                    'role': user['role']
                },
                'medical_history': {
                    'allergies': json.loads(history.get('allergies', '[]')) if history and history.get('allergies') is not None else [],
                    'conditions': json.loads(history.get('conditions', '[]')) if history and history.get('conditions') is not None else []
                },
                'prescriptions': prescriptions,
                'symptom_history': symptoms,
                'created_at': user['created_at'].isoformat(),
                'updated_at': history['updated_at'].isoformat() if history else user['created_at'].isoformat()
            }
            
            return record
            
        except Error as e:
            logger.error(f"Error getting patient record: {str(e)}")
            return None

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
            record['updated_at'] = datetime.now().isoformat()
            
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
        try:
            # First, ensure medication exists
            med_query = "SELECT id FROM medications WHERE name = %s"
            self.cursor.execute(med_query, (prescription['medication'],))
            med = self.cursor.fetchone()
            
            if not med:
                # Create medication if it doesn't exist
                med_insert = """
                    INSERT INTO medications (name, generic_name, dosage)
                    VALUES (%s, %s, %s)
                """
                self.cursor.execute(med_insert, (
                    prescription['medication'],
                    prescription['medication'],  # Use same name as generic
                    prescription['dosage']
                ))
                med_id = self.cursor.lastrowid
            else:
                med_id = med['id']
            
            # Insert prescription
            query = """
                INSERT INTO prescriptions 
                (id, patient_id, medication_id, dosage, frequency, duration, quantity, prescribed_by, status)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            """
            self.cursor.execute(query, (
                prescription['id'],
                patient_id,
                med_id,
                prescription['dosage'],
                prescription['frequency'],
                prescription['duration'],
                prescription['quantity'],
                prescription.get('prescribed_by', patient_id),
                prescription.get('status', 'pending')
            ))
            
            self.conn.commit()
            logger.info(f"Added prescription for patient ID: {patient_id}")
            return True
            
        except Error as e:
            logger.error(f"Error adding prescription: {str(e)}")
            return False

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
            record['updated_at'] = datetime.now().isoformat()
            
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
        try:
            query = """
                SELECT p.*, m.name as medication_name 
                FROM prescriptions p 
                JOIN medications m ON p.medication_id = m.id 
                WHERE p.patient_id = %s
            """
            params = [patient_id]
            
            if start_date:
                query += " AND p.prescribed_at >= %s"
                params.append(start_date)
            if end_date:
                query += " AND p.prescribed_at <= %s"
                params.append(end_date)
                
            query += " ORDER BY p.prescribed_at DESC"
            
            self.cursor.execute(query, params)
            return self.cursor.fetchall()
            
        except Error as e:
            logger.error(f"Error retrieving prescription history: {str(e)}")
            return []

    def add_symptom_history(self, patient_id: str, symptoms: list) -> bool:
        """Add a new symptom entry to the patient's symptom history."""
        try:
            query = """
                INSERT INTO symptom_history 
                (patient_id, symptoms)
                VALUES (%s, %s)
            """
            self.cursor.execute(query, (patient_id, json.dumps(symptoms)))
            self.conn.commit()
            
            logger.info(f"Added symptom history for patient ID: {patient_id}")
            return True
            
        except Error as e:
            logger.error(f"Error adding symptom history: {str(e)}")
            return False

    def get_all_patient_records(self, strip_sensitive: bool = False) -> List[Dict]:
        """
        Retrieve all patient records.
        Args:
            strip_sensitive: If True, remove sensitive info from personal_info
        Returns:
            List of dictionaries containing patient records
        """
        try:
            records = []
            for patient_file in self.patients_dir.glob('*.json'):
                try:
                    with open(patient_file, 'r') as f:
                        record = json.load(f)
                        if strip_sensitive and 'personal_info' in record:
                            record['personal_info'] = {
                                'name': record['personal_info'].get('name', ''),
                                'role': record['personal_info'].get('role', '')
                            }
                        records.append(record)
                except Exception as e:
                    logger.error(f"Error reading patient file {patient_file}: {str(e)}")
                    continue
            return records
        except Exception as e:
            logger.error(f"Error retrieving all patient records: {str(e)}")
            return []

    def close(self):
        """Close the database connection."""
        if hasattr(self, 'conn') and self.conn.is_connected():
            self.cursor.close()
            self.conn.close()
            logger.info("Database connection closed")