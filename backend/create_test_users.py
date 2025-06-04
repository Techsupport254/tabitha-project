import json
from pathlib import Path
from datetime import datetime
import uuid
from app import DatabaseManager

def create_test_users():
    # Initialize database manager
    db_manager = DatabaseManager()
    
    # Test users data
    test_users = [
        {
            'name': 'Test Patient',
            'email': 'patient@test.com',
            'role': 'patient',
            'dob': '1990-01-01',
            'gender': 'male',
            'password': 'User@123'
        },
        {
            'name': 'Test Doctor',
            'email': 'doctor@test.com',
            'role': 'doctor',
            'dob': '1985-01-01',
            'gender': 'male',
            'password': 'User@123'
        },
        {
            'name': 'Test Pharmacist',
            'email': 'pharmacist@test.com',
            'role': 'pharmacist',
            'dob': '1988-01-01',
            'gender': 'female',
            'password': 'User@123'
        },
        {
            'name': 'System Administrator',
            'email': 'admin@newchem.com',
            'role': 'admin',
            'dob': '1980-01-01',
            'gender': 'male',
            'password': 'User@123'
        }
    ]
    
    # Create user records
    for user in test_users:
        user_id = str(uuid.uuid4())
        success = db_manager.create_user(
            user_id=user_id,
            email=user['email'],
            password=user['password'],
            name=user['name'],
            role=user['role'],
            dob=user['dob'],
            gender=user['gender']
        )
        
        if success:
            print(f"Created {user['role']} user: {user['email']}")
        else:
            print(f"Failed to create {user['role']} user: {user['email']}")
    
    # Close database connection
    db_manager.close()

if __name__ == "__main__":
    create_test_users() 