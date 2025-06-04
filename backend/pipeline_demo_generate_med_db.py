import json
from pathlib import Path
import csv

RAW_FDA_PATH = Path('data/raw/drugsfda.json')
MEDDRA_IND_PATH = Path('data/raw/meddra_all_label_indications.tsv')
OUTPUT_PATH = Path('data/processed/medications.json')

# Load FDA data for drug name lookup
def load_fda_data():
    with open(RAW_FDA_PATH, 'r') as f:
        data = json.load(f)
    # Build a mapping from application_number to brand/generic names
    app_to_name = {}
    for entry in data.get('results', []):
        app_num = entry.get('application_number')
        name = None
        if 'openfda' in entry:
            name = (entry['openfda'].get('brand_name') or entry['openfda'].get('generic_name'))
            if isinstance(name, list):
                name = name[0]
        if not name and entry.get('products'):
            name = entry['products'][0].get('brand_name') or entry['products'][0].get('generic_name')
        if app_num and name:
            app_to_name[app_num] = name
    return app_to_name

def build_medication_db_from_meddra(app_to_name, max_per_disease=5):
    med_db = {}
    with open(MEDDRA_IND_PATH, 'r') as f:
        reader = csv.reader(f, delimiter='\t')
        for row in reader:
            if len(row) < 7:
                continue
            doc, app_cid, prod_cid, cui, ind_type, disease, _ = row[:7]
            disease = disease.strip().lower()
            if not disease:
                continue
            # Use document or app_cid as a proxy for drug
            drug_name = app_to_name.get(app_cid) or app_to_name.get(doc) or doc
            med = {
                'name': drug_name,
                'dosage': 'As prescribed',
                'frequency': 'As prescribed',
                'duration': 'As needed',
                'instructions': 'Follow doctor\'s instructions',
                'side_effects': []
            }
            if disease not in med_db:
                med_db[disease] = []
            if len(med_db[disease]) < max_per_disease:
                med_db[disease].append(med)
    return med_db

def main():
    print('Generating medications.json from meddra_all_label_indications.tsv and drugsfda.json...')
    app_to_name = load_fda_data()
    med_db = build_medication_db_from_meddra(app_to_name)
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT_PATH, 'w') as f:
        json.dump(med_db, f, indent=2)
    print(f'Saved {len(med_db)} diseases to {OUTPUT_PATH}')

if __name__ == '__main__':
    main() 