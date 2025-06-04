import pandas as pd
import numpy as np
from pathlib import Path
from typing import List, Dict, Tuple
from symptom_synonyms import symptom_synonyms
import os

class DiseasePredictor:
    def __init__(self, data_dir: str = None):
        self.data_dir = Path(data_dir) if data_dir else Path(os.path.dirname(os.path.abspath(__file__))) / 'model'
        self.symptom_disease_mapping = self._load_symptom_disease_mapping()
        
    def _load_symptom_disease_mapping(self) -> pd.DataFrame:
        """Load symptom-disease mapping from CSV file"""
        try:
            return pd.read_csv(self.data_dir / "symptom_disease_mapping.csv")
        except FileNotFoundError:
            print("Warning: symptom_disease_mapping.csv not found. Using empty mapping.")
            return pd.DataFrame()
            
    def predict_from_symptoms(self, symptoms: List[str]) -> List[Tuple[str, float]]:
        """
        Predict diseases based on input symptoms.
        Returns a list of (disease, probability) tuples.
        """
        if self.symptom_disease_mapping.empty:
            return []
            
        # Convert symptoms to their canonical forms using symptom_synonyms
        canonical_symptoms = set()
        for symptom in symptoms:
            for canonical, synonyms in symptom_synonyms.items():
                if symptom.lower() in synonyms:
                    canonical_symptoms.add(canonical)
                    break
            else:
                canonical_symptoms.add(symptom.lower())
                
        # Calculate disease scores based on matching symptoms
        disease_scores = {}
        for _, row in self.symptom_disease_mapping.iterrows():
            disease = row['disease']
            score = 0
            for symptom in canonical_symptoms:
                if symptom in row and row[symptom] == 1:
                    score += 1
            if score > 0:
                disease_scores[disease] = score / len(canonical_symptoms)
                
        # Sort diseases by score and return top predictions
        sorted_predictions = sorted(
            disease_scores.items(),
            key=lambda x: x[1],
            reverse=True
        )
        
        return sorted_predictions[:5]  # Return top 5 predictions 