import os
import json
from pathlib import Path
from security_manager import SecurityManager

def update_all_passwords():
    # Initialize security manager for password hashing
    security_manager = SecurityManager()
    
    # Get the data directory
    data_dir = Path("data/processed/patients")
    
    # New password to set
    new_password = "User@123"
    hashed_password = security_manager.hash_password(new_password)
    
    # Counter for updated records
    updated_count = 0
    
    # Iterate through all patient files
    for patient_file in data_dir.glob("*.json"):
        try:
            # Read the patient record
            with open(patient_file, 'r') as f:
                record = json.load(f)
            
            # Update the password in personal_info
            if 'personal_info' in record:
                record['personal_info']['password'] = hashed_password
                updated_count += 1
                
                # Write back the updated record
                with open(patient_file, 'w') as f:
                    json.dump(record, f, indent=2)
                    
        except Exception as e:
            print(f"Error updating {patient_file}: {str(e)}")
    
    print(f"Successfully updated {updated_count} user passwords to User@123")

if __name__ == "__main__":
    update_all_passwords() 