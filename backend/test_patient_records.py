import requests
import json
from datetime import datetime
import os
from typing import Dict, List, Optional

def load_session_cookie() -> Optional[Dict[str, str]]:
    """Load session cookie from the patient_cookies.json file in backend/cookies."""
    try:
        with open('backend/cookies/patient_cookies.json', 'r') as f:
            cookies = json.load(f)
            # The file should contain a 'session' key
            return {'session': cookies.get('session')}
    except FileNotFoundError:
        print("Error: backend/cookies/patient_cookies.json not found. Please run regenerate_test_cookies.py first.")
        return None
    except json.JSONDecodeError:
        print("Error: Invalid JSON in backend/cookies/patient_cookies.json")
        return None

def get_patient_medical_history(patient_id: str, cookies: Dict[str, str]) -> Optional[Dict]:
    """Get detailed medical history for a patient."""
    try:
        response = requests.get(
            f"http://127.0.0.1:5001/api/medical-history/{patient_id}",
            cookies=cookies,
            params={
                'include_prescriptions': 'true',
                'include_symptoms': 'true'
            }
        )
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"Error fetching medical history: {e}")
        return None

def get_patient_prescriptions(patient_id: str, cookies: Dict[str, str]) -> List[Dict]:
    """Get all prescriptions for a patient."""
    try:
        response = requests.get(
            "http://127.0.0.1:5001/api/prescriptions",
            cookies=cookies,
            params={'patient_id': patient_id}
        )
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"Error fetching prescriptions: {e}")
        return []

def format_prescription(prescription: Dict) -> str:
    """Format a prescription for display."""
    return f"""
    Medication: {prescription.get('medication_name', 'Unknown')}
    Dosage: {prescription.get('dosage', 'N/A')}
    Frequency: {prescription.get('frequency', 'N/A')}
    Status: {prescription.get('status', 'N/A')}
    Start Date: {prescription.get('start_date', 'N/A')}
    End Date: {prescription.get('end_date', 'N/A')}
    Notes: {prescription.get('notes', 'N/A')}
    """

def format_medical_history(history: Dict) -> str:
    """Format medical history for display."""
    return f"""
    Patient Information:
    ------------------
    Name: {history['personal_info']['name']}
    Email: {history['personal_info']['email']}
    Date of Birth: {history['personal_info']['dob']}
    Gender: {history['personal_info']['gender']}

    Medical History:
    ---------------
    Allergies: {', '.join(history['medical_history'].get('allergies', [])) or 'None'}
    Conditions: {', '.join(history['medical_history'].get('conditions', [])) or 'None'}

    Recent Symptoms:
    ---------------
    {format_symptoms(history.get('symptom_history', []))}

    Active Prescriptions:
    -------------------
    {format_prescriptions(history.get('prescriptions', []))}
    """

def format_symptoms(symptoms: List[Dict]) -> str:
    """Format symptom history for display."""
    if not symptoms:
        return "No recent symptoms recorded"
    
    formatted = []
    for symptom in symptoms[:5]:  # Show last 5 symptoms
        date = symptom.get('recorded_at', 'Unknown date')
        symptom_list = json.loads(symptom.get('symptoms', '[]'))
        formatted.append(f"Date: {date}\nSymptoms: {', '.join(symptom_list)}")
    
    return '\n\n'.join(formatted)

def format_prescriptions(prescriptions: List[Dict]) -> str:
    """Format prescriptions for display."""
    if not prescriptions:
        return "No active prescriptions"
    
    return '\n'.join(format_prescription(p) for p in prescriptions)

def main():
    # Load session cookie
    cookies = load_session_cookie()
    if not cookies:
        return

    # Get patient ID from the cookie (you might want to make this configurable)
    patient_id = "2e5e47b2-e77a-4930-a270-18c390c34133"  # Example patient ID

    print("\nFetching patient records...")
    print("=" * 50)

    # Get medical history
    medical_history = get_patient_medical_history(patient_id, cookies)
    if medical_history:
        print(format_medical_history(medical_history))
    else:
        print("Failed to fetch medical history")

    # Get all prescriptions
    print("\nFetching all prescriptions...")
    print("=" * 50)
    prescriptions = get_patient_prescriptions(patient_id, cookies)
    if prescriptions:
        print(f"Found {len(prescriptions)} prescriptions:")
        for prescription in prescriptions:
            print(format_prescription(prescription))
    else:
        print("No prescriptions found")

if __name__ == "__main__":
    main() 