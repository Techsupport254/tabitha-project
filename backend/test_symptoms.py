import requests
import json
from pathlib import Path

# Dynamically load the test patient's cookie from backend/cookies/patient_cookies.json
cookie_path = Path('backend/cookies/patient_cookies.json')
with open(cookie_path) as f:
    cookie_data = json.load(f)
    cookie = cookie_data['session']

# Test data
data = {
    "description": """
    I've been experiencing a nagging dry cough for the past few days, along with some chest discomfort. 
    I've also had low-grade fevers (around 99-100°F) and my appetite has been reduced. 
    I feel quite fatigued and have been having trouble sleeping due to the cough. 
    My throat is sore and I've been experiencing some body aches. 
    I've also noticed some congestion and occasional shortness of breath.
    """
}

# Make the request
response = requests.post(
    'http://127.0.0.1:5001/api/symptoms',
    json=data,
    headers={'Cookie': f'session={cookie}'}
)

# Print response
print(f"HTTP Status Code: {response.status_code}")
print("\nResponse:")
print(json.dumps(response.json(), indent=2)) 