import json
import pandas as pd
from pathlib import Path
from typing import Dict, List, Any

def generate_medications_json():
    """Generate medications.json using drug_info.csv data."""
    data_dir = Path("data/processed")
    
    # Load drug info
    try:
        drug_info = pd.read_csv(data_dir / "drug_info.csv")
    except FileNotFoundError:
        print("Error: drug_info.csv not found")
        return
        
    # Create medications dictionary
    medications: Dict[str, List[Dict[str, Any]]] = {}
    
    # Process each drug
    for _, row in drug_info.iterrows():
        if pd.isna(row['indications']):
            continue
            
        # Clean up indications text
        indications = row['indications'].lower()
        if isinstance(indications, str):
            # Extract main indication (first sentence or bullet point)
            if '•' in indications:
                indications = [i.strip() for i in indications.split('•') if i.strip()]
                if indications:
                    indications = indications[0]
            else:
                indications = indications.split('.')[0]
                
            # Create medication entry
            medication = {
                "name": row['brand_name'].strip('[]\''),
                "generic_name": row['generic_name'].strip('[]\'') if pd.notna(row['generic_name']) else None,
                "dosage": row['dosage'].strip('[]\'') if pd.notna(row['dosage']) else "As prescribed",
                "frequency": "As prescribed",
                "duration": "As prescribed",
                "instructions": row['warnings'].strip('[]\'') if pd.notna(row['warnings']) else "Follow doctor's instructions",
                "side_effects": []
            }
            
            # Add to medications dictionary
            if indications not in medications:
                medications[indications] = []
            medications[indications].append(medication)
    
    # Add common medications for flu and psoriasis
    medications["flu"] = [
        {
            "name": "Acetaminophen",
            "generic_name": "Acetaminophen",
            "dosage": "500-1000mg",
            "frequency": "Every 4-6 hours as needed",
            "duration": "Until symptoms resolve",
            "instructions": "Take with food if stomach upset occurs. Do not exceed 4000mg in 24 hours.",
            "side_effects": ["Liver damage (if taken in excess)", "Allergic reactions"]
        },
        {
            "name": "Ibuprofen",
            "generic_name": "Ibuprofen",
            "dosage": "200-400mg",
            "frequency": "Every 4-6 hours as needed",
            "duration": "Until symptoms resolve",
            "instructions": "Take with food. Do not exceed 1200mg in 24 hours.",
            "side_effects": ["Stomach upset", "Kidney problems (with long-term use)"]
        }
    ]
    
    medications["psoriasis"] = [
        {
            "name": "Hydrocortisone",
            "generic_name": "Hydrocortisone",
            "dosage": "1% cream",
            "frequency": "Apply 2-4 times daily",
            "duration": "As directed by doctor",
            "instructions": "Apply a thin layer to affected areas. Avoid contact with eyes.",
            "side_effects": ["Skin thinning", "Burning sensation"]
        },
        {
            "name": "Betamethasone",
            "generic_name": "Betamethasone dipropionate",
            "dosage": "0.05% cream",
            "frequency": "Apply once or twice daily",
            "duration": "As directed by doctor",
            "instructions": "Apply a thin film to affected areas. Do not use with occlusive dressings unless directed.",
            "side_effects": ["Skin thinning", "Stretch marks"]
        }
    ]
    
    # Save to medications.json
    output_path = data_dir / "medications.json"
    with open(output_path, 'w') as f:
        json.dump(medications, f, indent=2)
        
    print(f"Generated medications.json with {len(medications)} diseases")

if __name__ == "__main__":
    generate_medications_json() 