import requests
import json
from pathlib import Path
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def regenerate_test_cookies():
    # Base URL for the API
    base_url = 'http://127.0.0.1:5001'
    
    # Test users with complete information
    users = [
        {
            'email': 'patient@test.com',
            'password': 'User@123',
            'name': 'Test Patient',
            'role': 'patient',
            'dob': '1990-01-01',
            'gender': 'male'
        },
        {
            'email': 'doctor@test.com',
            'password': 'User@123',
            'name': 'Test Doctor',
            'role': 'doctor',
            'dob': '1985-01-01',
            'gender': 'male'
        },
        {
            'email': 'pharmacist@test.com',
            'password': 'User@123',
            'name': 'Test Pharmacist',
            'role': 'pharmacist',
            'dob': '1988-01-01',
            'gender': 'female'
        }
    ]
    
    # Create cookies directory
    cookies_dir = Path('cookies')
    cookies_dir.mkdir(exist_ok=True)
    
    # First ensure users exist with correct information
    for user in users:
        try:
            # Try to register the user (will update if exists)
            register_response = requests.post(
                f'{base_url}/api/register',
                json=user
            )
            
            if register_response.status_code not in [200, 409]:  # 409 means user already exists
                print(f"Failed to register/update {user['role']}: {register_response.text}")
                continue
                
            # Login to get fresh session
            login_response = requests.post(
                f'{base_url}/api/login',
                json={
                    'email': user['email'],
                    'password': user['password']
                }
            )
            
            if login_response.status_code == 200:
                # Get cookies from response
                cookies = login_response.cookies.get_dict()
                
                # Store cookies in file
                cookie_file = cookies_dir / f"{user['role']}_cookies.json"
                with open(cookie_file, 'w') as f:
                    json.dump(cookies, f, indent=2)
                    
                print(f"Successfully stored cookies for {user['role']}")
            else:
                print(f"Failed to login as {user['role']}: {login_response.text}")
                
        except Exception as e:
            print(f"Error handling {user['role']}: {str(e)}")

if __name__ == "__main__":
    regenerate_test_cookies() 