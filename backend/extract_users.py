import json
from pathlib import Path

def extract_users():
    # Get the data directory
    data_dir = Path("data/processed/patients")
    
    # List to store user information
    users = []
    
    # Iterate through all patient files
    for patient_file in data_dir.glob("*.json"):
        try:
            # Read the patient record
            with open(patient_file, 'r') as f:
                record = json.load(f)
            
            # Extract user information
            if 'personal_info' in record:
                user_info = record['personal_info']
                users.append({
                    'name': user_info.get('name', 'N/A'),
                    'email': user_info.get('email', 'N/A'),
                    'role': user_info.get('role', 'N/A'),
                    'dob': user_info.get('dob', 'N/A'),
                    'age': user_info.get('age', 'N/A')
                })
                    
        except Exception as e:
            print(f"Error reading {patient_file}: {str(e)}")
    
    # Write users to a text file
    with open('users.txt', 'w') as f:
        f.write("User Information:\n")
        f.write("=" * 50 + "\n\n")
        for i, user in enumerate(users, 1):
            f.write(f"User {i}:\n")
            f.write(f"Name: {user['name']}\n")
            f.write(f"Email: {user['email']}\n")
            f.write(f"Role: {user['role']}\n")
            f.write(f"Date of Birth: {user['dob']}\n")
            f.write(f"Age: {user['age']}\n")
            f.write("-" * 30 + "\n\n")
    
    print(f"Successfully extracted {len(users)} users to users.txt")

if __name__ == "__main__":
    extract_users() 