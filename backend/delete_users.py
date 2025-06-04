import shutil
from pathlib import Path

def delete_all_users():
    # Get the data directory
    data_dir = Path("data/processed/patients")
    
    if data_dir.exists():
        # Delete the entire patients directory
        shutil.rmtree(data_dir)
        print("Successfully deleted all user records")
    else:
        print("No user records found to delete")

if __name__ == "__main__":
    delete_all_users() 