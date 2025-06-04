import json
from pathlib import Path
from datetime import datetime
import uuid

def create_test_users():
    # Get the data directory
    data_dir = Path("data/processed/patients")
    data_dir.mkdir(parents=True, exist_ok=True)
    
    # Test users data
    test_users = [
        {
            'name': 'Test Patient',
            'email': 'patient@test.com',
            'role': 'patient',
            'dob': '1990-01-01',
            'age': 34,
            'password': 'User@123'
        },
        {
            'name': 'Test Doctor',
            'email': 'doctor@test.com',
            'role': 'doctor',
            'dob': '1985-01-01',
            'age': 39,
            'password': 'User@123'
        },
        {
            'name': 'Test Pharmacist',
            'email': 'pharmacist@test.com',
            'role': 'pharmacist',
            'dob': '1988-01-01',
            'age': 36,
            'password': 'User@123'
        },
        {
            'name': 'System Administrator',
            'email': 'admin@newchem.com',
            'role': 'administrator',
            'dob': '1980-01-01',
            'age': 44,
            'password': 'User@123'
        }
    ]
    
    # Create user records
    for user in test_users:
        user_id = str(uuid.uuid4())
        record = {
            'patient_id': user_id,
            'personal_info': user,
            'medical_history': {},
            'prescriptions': [],
            'allergies': [],
            'conditions': [],
            'created_at': datetime.now().isoformat(),
            'updated_at': datetime.now().isoformat()
        }
        
        # Save to file
        file_path = data_dir / f"{user_id}.json"
        with open(file_path, 'w') as f:
            json.dump(record, f, indent=2)
            
        print(f"Created {user['role']} user: {user['email']}")

if __name__ == "__main__":
    create_test_users() 