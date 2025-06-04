"""
Medication recommendation and drug interaction checking module.
This module handles medication recommendations based on disease predictions
and checks for potential drug interactions.
"""

import pandas as pd
import numpy as np
from typing import List, Dict, Set, Tuple, Any
import logging
from pathlib import Path
import json
import re
import os

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class MedicationRecommender:
    def __init__(self, data_dir: str = None):
        """Initialize the medication recommender."""
        self.data_dir = Path(data_dir) if data_dir else Path('data/processed')
        self.medications = self._load_medications()
        self.drug_info = self._load_drug_info()
        self.interaction_db = None
        self.load_databases()
        
    def load_databases(self) -> None:
        """Load medication and interaction databases."""
        try:
            # Load interaction database
            interaction_db_path = self.data_dir / "drug_interactions.json"
            if interaction_db_path.exists():
                with open(interaction_db_path, 'r') as f:
                    self.interaction_db = json.load(f)
            else:
                logger.warning("Interaction database not found. Creating empty database.")
                self.interaction_db = {}
                
        except Exception as e:
            logger.error(f"Error loading databases: {str(e)}")
            raise
            
    def _load_medications(self) -> Dict[str, List[Dict[str, Any]]]:
        """Load medications from JSON file."""
        try:
            with open(self.data_dir / "medications.json", 'r') as f:
                return json.load(f)
        except FileNotFoundError:
            logger.warning("Medications file not found. Creating empty database.")
            return {}
        except json.JSONDecodeError:
            logger.error("Error decoding medications file. Creating empty database.")
            return {}
            
    def _load_drug_info(self) -> pd.DataFrame:
        """Load detailed drug information from drug_info.csv"""
        try:
            file_path = self.data_dir / "drug_info.csv"
            logger.info(f"Attempting to load drug_info.csv from: {file_path}")
            df = pd.read_csv(file_path)
            
            # Clean the data by removing square brackets and quotes
            for col in df.columns:
                if df[col].dtype == 'object':  # Only process string columns
                    df[col] = df[col].str.replace(r'[\[\]\']', '', regex=True)
                    df[col] = df[col].str.strip()
            
            # Create a mapping of application numbers to drug names
            self.drug_mapping = {}
            for _, row in df.iterrows():
                if pd.notna(row['brand_name']) and pd.notna(row['generic_name']):
                    # Store both brand and generic names
                    self.drug_mapping[row['brand_name']] = {
                        'brand_name': row['brand_name'],
                        'generic_name': row['generic_name'],
                        'dosage': row['dosage'] if pd.notna(row['dosage']) else "As prescribed",
                        'warnings': row['warnings'] if pd.notna(row['warnings']) else "Follow doctor's instructions"
                    }
            logger.info(f"Successfully loaded drug_info.csv with {len(df)} rows")
            return df
        except FileNotFoundError:
            logger.error(f"Warning: drug_info.csv not found at {self.data_dir / 'drug_info.csv'}. Using empty database.")
            return pd.DataFrame()
            
    def _get_drug_details(self, drug_code: str) -> Dict[str, Any]:
        """Get detailed drug information from the mapping."""
        # Try to find the drug in our mapping
        if drug_code in self.drug_mapping:
            return self.drug_mapping[drug_code]
            
        # If not found, return a basic structure with the code
        return {
            'brand_name': drug_code,
            'generic_name': 'Unknown',
            'dosage': 'As prescribed',
            'warnings': 'Follow doctor\'s instructions'
        }
    
    def _normalize_text(self, text: str) -> str:
        """Normalize text for better matching."""
        # Convert to lowercase and remove special characters
        text = text.lower()
        text = re.sub(r'[^\w\s]', '', text)
        return text.strip()
        
    def _get_disease_matches(self, disease: str) -> List[str]:
        """Get matching diseases from the medications database."""
        normalized_disease = self._normalize_text(disease)
        matches = []
        
        # First try exact match
        if disease in self.medications:
            matches.append(disease)
            
        # Then try normalized match
        normalized_matches = [d for d in self.medications.keys() 
                            if self._normalize_text(d) == normalized_disease]
        matches.extend(normalized_matches)
        
        # Finally try partial matches
        partial_matches = [d for d in self.medications.keys()
                         if normalized_disease in self._normalize_text(d) or
                            self._normalize_text(d) in normalized_disease]
        matches.extend(partial_matches)
        
        return list(set(matches))  # Remove duplicates
        
    def _is_relevant_medication(self, med: Dict[str, Any], disease: str) -> bool:
        """Check if a medication is relevant for the given disease."""
        # Check if the disease is mentioned in the medication's instructions or dosage
        med_text = f"{med.get('instructions', '')} {med.get('dosage', '')}".lower()
        disease_words = set(self._normalize_text(disease).split())
        
        # Count how many disease words appear in the medication text
        matches = sum(1 for word in disease_words if word in med_text)
        return matches >= len(disease_words) * 0.5  # At least 50% of words should match

    def get_medication_recommendations(self, disease: str) -> List[Dict[str, Any]]:
        """Get medication recommendations for a disease."""
        if not self.medications:
            return []

        # Get matching diseases
        matching_diseases = self._get_disease_matches(disease)
        if not matching_diseases:
            return []

        # Collect medications from all matching diseases
        all_medications = []
        for matching_disease in matching_diseases:
            medications = self.medications[matching_disease]
            # Filter medications for relevance
            relevant_meds = [med for med in medications 
                           if self._is_relevant_medication(med, disease)]
            all_medications.extend(relevant_meds)

        # Sort medications by relevance (those with more complete information first)
        def med_score(med: Dict[str, Any]) -> int:
            score = 0
            if med.get('dosage'): score += 2
            if med.get('instructions'): score += 2
            if med.get('generic_name'): score += 1
            return score

        sorted_medications = sorted(all_medications, key=med_score, reverse=True)
        return sorted_medications[:10]  # Return top 10 most relevant medications
        
    def check_drug_interactions(self, 
                               medications: List[str],
                               patient_medications: List[str] = None) -> List[Dict]:
        """
        Check for potential drug interactions.
        
        Args:
            medications: List of newly prescribed medications
            patient_medications: List of medications patient is currently taking
            
        Returns:
            List of potential interactions
        """
        if not self.interaction_db:
            logger.error("Interaction database not loaded")
            return []
            
        interactions = []
        all_meds = medications + (patient_medications or [])
        
        for i, med1 in enumerate(all_meds):
            for med2 in all_meds[i+1:]:
                interaction_key = f"{med1.lower()}_{med2.lower()}"
                if interaction_key in self.interaction_db:
                    interactions.append({
                        'medication1': med1,
                        'medication2': med2,
                        'severity': self.interaction_db[interaction_key]['severity'],
                        'description': self.interaction_db[interaction_key]['description'],
                        'recommendation': self.interaction_db[interaction_key]['recommendation']
                    })
                    
        return interactions
        
    def _check_contraindications(self, 
                                medication: Dict, 
                                patient_history: Dict) -> bool:
        """Check if medication is contraindicated based on patient history."""
        if 'contraindications' not in medication:
            return False
            
        for condition in medication['contraindications']:
            if condition in patient_history.get('conditions', []):
                return True
                
        return False
        
    def update_medication_database(self, 
                                 disease: str, 
                                 medications: List[Dict]) -> None:
        """Update the medication database with new information."""
        if disease not in self.medications:
            self.medications[disease] = []
            
        self.medications[disease].extend(medications)
        
        # Save updated database
        with open(self.data_dir / "medications.json", 'w') as f:
            json.dump(self.medications, f, indent=2)
            
    def update_interaction_database(self, 
                                  medication1: str, 
                                  medication2: str,
                                  interaction: Dict) -> None:
        """Update the drug interaction database with new information."""
        interaction_key = f"{medication1.lower()}_{medication2.lower()}"
        self.interaction_db[interaction_key] = interaction
        
        # Save updated database
        with open(self.data_dir / "drug_interactions.json", 'w') as f:
            json.dump(self.interaction_db, f, indent=2) 