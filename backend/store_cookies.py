import requests
import json
from pathlib import Path

def store_cookies():
    # Base URL for the API
    base_url = 'http://127.0.0.1:5001'
    
    # Test users
    users = [
        {
            'email': 'patient@test.com',
            'password': 'User@123',
            'role': 'patient'
        },
        {
            'email': 'doctor@test.com',
            'password': 'User@123',
            'role': 'doctor'
        },
        {
            'email': 'pharmacist@test.com',
            'password': 'User@123',
            'role': 'pharmacist'
        }
    ]
    
    # Create cookies directory
    cookies_dir = Path('cookies')
    cookies_dir.mkdir(exist_ok=True)
    
    # Login and store cookies for each user
    for user in users:
        try:
            # Login request
            response = requests.post(
                f'{base_url}/api/login',
                json={
                    'email': user['email'],
                    'password': user['password']
                }
            )
            
            if response.status_code == 200:
                # Get cookies from response
                cookies = response.cookies.get_dict()
                
                # Store cookies in file
                cookie_file = cookies_dir / f"{user['role']}_cookies.json"
                with open(cookie_file, 'w') as f:
                    json.dump(cookies, f, indent=2)
                    
                print(f"Successfully stored cookies for {user['role']}")
            else:
                print(f"Failed to login as {user['role']}: {response.text}")
                
        except Exception as e:
            print(f"Error storing cookies for {user['role']}: {str(e)}")

if __name__ == "__main__":
    store_cookies() 