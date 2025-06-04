import sys
import argparse
from pathlib import Path
import json
from test_model import DiseasePredictorTester
from medication_recommender import MedicationRecommender
from patient_history import PatientHistoryManager
import re
import logging
import os

# Import the symptom_synonyms dictionary
from symptom_synonyms import symptom_synonyms

# Constants for confidence thresholds
MIN_DISEASE_CONFIDENCE = 0.1  # Minimum confidence percentage for disease predictions
MAX_SYMPTOMS = 10  # Maximum number of symptoms to consider
TOP_N_DISEASES = 3  # Only show the top 3 predictions

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def extract_symptoms_from_description(description: str):
    """Extract symptoms from a free-text description using the symptom_synonyms dictionary."""
    detected = set()
    text = description.lower()
    
    # First pass: look for exact matches with word boundaries
    for canonical, synonyms in symptom_synonyms.items():
        for synonym in synonyms:
            # Use word boundaries and ensure the synonym is a complete word/phrase
            pattern = r'\b' + re.escape(synonym.lower()) + r'\b'
            if re.search(pattern, text):
                # Check if the symptom is negated (e.g., "no fever", "not coughing")
                negated = False
                for neg in ['no ', 'not ', 'without ', 'never ']:
                    if text.find(neg + synonym.lower()) != -1:
                        negated = True
                        break
                if not negated:
                    # Check for context words that might indicate the symptom is not present
                    context_words = ['used to', 'had', 'previous', 'past', 'history of']
                    if not any(word in text[:text.find(synonym.lower())] for word in context_words):
                        detected.add(canonical)
                break
    
    # If we have too many symptoms, prioritize the most specific ones
    if len(detected) > MAX_SYMPTOMS:
        # Sort symptoms by length (longer phrases are usually more specific)
        sorted_symptoms = sorted(detected, key=len, reverse=True)
        detected = set(sorted_symptoms[:MAX_SYMPTOMS])
    
    return list(detected)

def filter_medications_by_history(meds, patient_history):
    """Filter out medications that are contraindicated or contain allergens for the patient."""
    if not patient_history:
        return meds
    allergies = set(a.lower() for a in patient_history.get('allergies', []))
    conditions = set(c.lower() for c in patient_history.get('medical_history', []))
    filtered = []
    for med in meds:
        # Check for allergy
        med_name = med.get('name', '').lower()
        med_generic = med.get('generic_name', '').lower()
        if any(allergy in med_name or allergy in med_generic for allergy in allergies):
            continue
        # Check for contraindications
        contraindications = [c.lower() for c in med.get('contraindications', [])]
        if any(cond in conditions for cond in contraindications):
            continue
        filtered.append(med)
    return filtered

def main():
    parser = argparse.ArgumentParser(description="AI-Assisted Medicine Prescription Pipeline Demo")
    parser.add_argument('--description', type=str, help='Free-text description of the situation (symptoms, context, etc.)')
    parser.add_argument('--patient_id', type=str, help='Patient ID for personalized recommendations')
    args = parser.parse_args()

    # Update paths to point to the correct location
    data_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'data', 'processed')
    model_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'model', 'disease_predictor.pkl')
    medications_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'data', 'processed', 'medications.json')

    # Load model and recommender
    predictor = DiseasePredictorTester(model_path)
    recommender = MedicationRecommender(data_dir)
    patient_history_manager = PatientHistoryManager(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'data'))

    # Load the model before making predictions
    predictor.load_model()

    if args.description:
        description = args.description
    else:
        print("Enter a description of your situation (symptoms, context, etc.):")
        description = input().strip()

    # Extract symptoms
    symptoms = extract_symptoms_from_description(description)
    if not symptoms:
        logger.warning("No symptoms detected in the description.")
        return
        
    print(f"\nDetected symptoms: {', '.join(symptoms)}\n")

    # Predict disease
    detected_symptoms, disease_preds = predictor.predict_from_text(' '.join(symptoms))

    # Filter predictions by confidence threshold and take top N
    filtered_preds = [(d, conf) for d, conf in disease_preds if conf >= MIN_DISEASE_CONFIDENCE]
    filtered_preds = filtered_preds[:TOP_N_DISEASES]
    
    if not filtered_preds:
        logger.warning("No diseases predicted with sufficient confidence.")
        print("If your symptoms are severe or worsening, please consult a healthcare professional.")
        return

    # Load patient history if patient_id is provided
    patient_history = None
    if args.patient_id:
        patient_history = patient_history_manager.get_patient_record(args.patient_id)
        if not patient_history:
            print(f"Warning: No patient history found for ID {args.patient_id}. Proceeding without personalization.")

    print("Top disease predictions:")
    for d, conf in filtered_preds:
        print(f"- {d} (confidence: {conf:.2f}%)")
    print()

    # Medication recommendations
    for d, conf in filtered_preds:
        print(f"Medication recommendations for {d}:")
        recs = recommender.get_medication_recommendations(d)
        # Filter by patient history
        recs = filter_medications_by_history(recs, patient_history)
        if not recs:
            print("No medication recommendations found for this patient. Please consult a healthcare professional for further evaluation.\n")
        else:
            for i, med in enumerate(recs[:10], 1):
                print(f"  {i}. {med.get('name', 'Unknown')}")
                print(f"     Generic name: {med.get('generic_name', 'Unknown')}")
                if med.get('dosage'):
                    print(f"     Dosage: {med.get('dosage')}")
                if med.get('instructions'):
                    print(f"     Instructions: {med.get('instructions')}")
                print()

if __name__ == "__main__":
    main() 