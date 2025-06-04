"""
Test script for the disease prediction model.
This script loads a trained model and makes predictions on test data.
"""

import pandas as pd
import numpy as np
import joblib
import logging
from pathlib import Path
from typing import Dict, List, Set
import spacy
from sklearn.metrics.pairwise import cosine_similarity
import re
import os
try:
    from src.symptom_synonyms import symptom_synonyms
except ImportError:
    from symptom_synonyms import symptom_synonyms
import difflib

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class DiseasePredictorTester:
    def __init__(self, model_path: str = None):
        """Initialize the disease predictor tester."""
        self.model_path = model_path or os.path.join(os.path.dirname(os.path.abspath(__file__)), 'model', 'disease_predictor.pkl')
        self.model_data = None
        self.model = None
        self.feature_names = None
        self.label_names = None
        self.nlp = None
        self.symptom_synonyms = symptom_synonyms
        # Expanded negation patterns
        self.negation_patterns = [
            r'no\s+{}', r'not\s+{}', r'without\s+{}', r'denies\s+{}', r'never\s+{}', 
            r'free of\s+{}', r'absent\s+{}', r'negative for\s+{}', r"don't have\s+{}",
            r"doesn't have\s+{}", r"didn't have\s+{}", r"haven't had\s+{}", r"hasn't had\s+{}"
        ]
        self.use_scispacy = False
        try:
            import scispacy
            import en_core_sci_sm
            self.nlp = en_core_sci_sm.load()
            self.use_scispacy = True
            logger.info("Using scispaCy for advanced medical NLP.")
        except ImportError:
            self.nlp = spacy.load('en_core_web_sm')
            logger.info("Using spaCy for NLP.")
        
    def load_model(self) -> None:
        """Load the trained model and associated data."""
        logger.info(f"Loading model from {self.model_path}")
        try:
            # Load disease prediction model
            self.model_data = joblib.load(self.model_path)
            self.model = self.model_data['model']
            self.feature_names = self.model_data['feature_names']
            self.label_names = self.model_data['label_names']
            
            # Load spaCy model for NLP processing
            logger.info("Loading spaCy model for symptom processing")
            logger.info("Models loaded successfully")
        except Exception as e:
            logger.error(f"Error loading models: {str(e)}")
            raise
            
    def preprocess_text(self, text: str) -> str:
        """Preprocess the input text for better matching."""
        # Convert to lowercase
        text = text.lower()
        # Remove punctuation but keep important medical terms
        text = re.sub(r'[^\w\s\-]', ' ', text)
        # Remove extra whitespace
        text = ' '.join(text.split())
        return text
            
    def get_embedding(self, text: str) -> np.ndarray:
        """Get embedding for a text using spaCy."""
        doc = self.nlp(text)
        return doc.vector
            
    def is_negated(self, description: str, term: str) -> bool:
        """Check if a symptom term is negated in the description."""
        window = 8  # Increased context window
        tokens = description.split()
        term_tokens = term.split()
        for i in range(len(tokens) - len(term_tokens) + 1):
            if tokens[i:i+len(term_tokens)] == term_tokens:
                start = max(0, i - window)
                end = min(len(tokens), i + len(term_tokens) + window)
                context = ' '.join(tokens[start:end])
                for pattern in self.negation_patterns:
                    if re.search(pattern.format(re.escape(term)), context):
                        return True
        return False

    def fuzzy_match(self, word, choices, cutoff=0.7):  # Lowered threshold
        matches = difflib.get_close_matches(word, choices, n=1, cutoff=cutoff)
        return matches[0] if matches else None

    def get_negated_spans(self, text: str) -> Set[str]:
        """Return a set of symptom phrases that are negated in the text using spaCy dependency parsing and regex for lists."""
        negated = set()
        doc = self.nlp(text)
        for token in doc:
            if token.dep_ == 'neg':
                head = token.head
                span = doc[head.left_edge.i:head.right_edge.i+1]
                for t in span:
                    if t.pos_ in {'NOUN', 'PROPN', 'ADJ'} or t.lemma_ in self.symptom_synonyms:
                        negated.add(t.lemma_.lower())
                negated.add(span.text.lower())
        # Improved: handle 'no fever or cough' and similar lists
        for match in re.finditer(r'no ([\w\s,]+?)(?:\.|,|;|$)', text.lower()):
            items = re.split(r'\bor\b|\band\b|,', match.group(1))
            for item in items:
                item = item.strip()
                if item:
                    negated.add(item)
        return negated

    def extract_symptoms(self, description: str) -> Set[str]:
        """Extract symptoms from the description using both NLP and keyword matching, with improved negation and stricter fuzzy/semantic matching."""
        symptoms = set()
        description_clean = self.preprocess_text(description)
        description_words = set(description_clean.split())
        description_embedding = self.get_embedding(description_clean)
        negated_spans = self.get_negated_spans(description)
        
        for symptom, synonyms in self.symptom_synonyms.items():
            found = False
            # Check if any synonym is negated (robustly)
            negated = False
            for syn in synonyms:
                for n in negated_spans:
                    # Use set intersection for multi-word synonyms
                    syn_words = set(syn.split())
                    n_words = set(n.split())
                    if syn in n or n in syn or len(syn_words & n_words) > 0:
                        negated = True
                        break
                if negated:
                    break
            if negated:
                continue
            for syn in synonyms:
                # Exact match
                if syn in description_clean:
                    symptoms.add(symptom)
                    found = True
                    break
                # Fuzzy match for single words (stricter cutoff)
                for word in description_words:
                    match = self.fuzzy_match(word, [syn], cutoff=0.85)
                    if match:
                        symptoms.add(symptom)
                        found = True
                        break
                if found:
                    break
            # Second pass: semantic similarity for unmatched symptoms (stricter threshold)
            if not found:
                symptom_embedding = self.get_embedding(symptom)
                similarity = cosine_similarity([description_embedding], [symptom_embedding])[0][0]
                if similarity > 0.6:
                    symptoms.add(symptom)
        # Handle compound symptoms
        compound_symptoms = {
            ('sharp', 'pain'): 'abdominal pain',
            ('burning', 'urination'): 'burning urination',
            ('decreased', 'appetite'): 'appetite loss',
            ('unusual', 'tiredness'): 'fatigue'
        }
        for (word1, word2), symptom in compound_symptoms.items():
            if word1 in description_words and word2 in description_words:
                # Check if either word is negated
                negated = False
                for n in negated_spans:
                    if word1 in n or word2 in n:
                        negated = True
                        break
                if not negated:
                    symptoms.add(symptom)
        return symptoms
            
    def predict_from_text(self, description: str):
        """Make predictions based on natural language description of symptoms."""
        if self.model is None:
            raise ValueError("Model not loaded. Call load_model() first.")
        
        # Extract symptoms from the description
        detected_symptoms = self.extract_symptoms(description)
        logger.info(f"Detected symptoms: {', '.join(detected_symptoms)}")
        
        # Create feature vector
        symptoms = {feature: 1 if feature in detected_symptoms else 0 
                   for feature in self.feature_names}
        
        # Create feature vector
        X = pd.DataFrame([symptoms])
        
        # Make prediction
        probabilities = self.model.predict_proba(X)[0]
        
        # Get top 3 predictions
        top_indices = np.argsort(probabilities)[-3:][::-1]
        
        predictions = []
        for idx in top_indices:
            predictions.append((self.label_names[idx], float(probabilities[idx])))
        
        return detected_symptoms, predictions

def main():
    """Main function to test the model."""
    try:
        # Initialize tester
        tester = DiseasePredictorTester()
        
        # Load model
        tester.load_model()
        
        # Get user input
        print("\nPlease describe your symptoms in natural language:")
        description = input("> ")
        
        # Make prediction
        detected_symptoms, predictions = tester.predict_from_text(description)
        
        # Print results
        print("\nTop 3 predicted diseases:")
        for pred in predictions:
            print(f"{pred[0]}: {pred[1]:.2%}")
            
    except Exception as e:
        logger.error(f"Error in testing pipeline: {str(e)}")
        raise

if __name__ == "__main__":
    main() 