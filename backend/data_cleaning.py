import pandas as pd
import numpy as np
from pathlib import Path
import logging
import re
from typing import Dict, List, Tuple
import json

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class DataCleaner:
    def __init__(self, data_dir: str = "data/processed"):
        """Initialize the data cleaner with the processed data directory path."""
        self.data_dir = Path(data_dir)
        self.cleaned_data = {}
        
    def clean_text(self, text: str) -> str:
        """Clean text data by removing special characters and standardizing format."""
        if not isinstance(text, str):
            return ""
        
        # Convert to lowercase
        text = text.lower()
        
        # Remove special characters and extra whitespace
        text = re.sub(r'[^\w\s]', ' ', text)
        text = re.sub(r'\s+', ' ', text)
        
        return text.strip()
    
    def clean_meddra_data(self, df: pd.DataFrame) -> pd.DataFrame:
        """Clean MedDRA terminology data."""
        logger.info("Cleaning MedDRA data...")
        
        # Clean text columns
        text_columns = ['symptom', 'disease']
        for col in text_columns:
            if col in df.columns:
                df[col] = df[col].apply(self.clean_text)
        
        # Remove duplicates
        df = df.drop_duplicates()
        
        # Remove rows with empty symptoms
        df = df[df['symptom'].str.len() > 0]
        
        # Standardize term types if applicable
        if 'term_type' in df.columns:
            df['term_type'] = df['term_type'].str.upper()
        
        return df
    
    def clean_drug_data(self, df: pd.DataFrame) -> pd.DataFrame:
        """Clean drug-related data."""
        logger.info("Cleaning drug data...")
        
        # Clean text columns (adjust column names based on your actual data)
        text_columns = ['drug_name', 'indication', 'description', 'label']
        for col in text_columns:
            if col in df.columns:
                df[col] = df[col].apply(self.clean_text)
        
        # Remove duplicates
        df = df.drop_duplicates()
        
        # Handle missing values
        df = df.fillna({
            'drug_name': 'unknown',
            'indication': 'unknown',
            'description': 'unknown',
            'label': 'unknown'
        })
        
        return df
    
    def create_symptom_disease_mapping(self, meddra_df: pd.DataFrame) -> pd.DataFrame:
        """Create a clean mapping between symptoms and diseases."""
        logger.info("Creating symptom-disease mapping...")
        
        # Filter for relevant term types (adjust based on your needs)
        symptom_terms = meddra_df[meddra_df['term_type'].isin(['PT', 'LT'])]
        
        # Create mapping
        mapping_data = []
        for _, row in symptom_terms.iterrows():
            mapping_data.append({
                'symptom': row['term'],
                'disease': row['term'],  # This is simplified - you'll need proper disease mapping
                'concept_id': row['concept_id'],
                'term_type': row['term_type']
            })
        
        return pd.DataFrame(mapping_data)
    
    def create_drug_recommendation_data(self, 
                                      meddra_df: pd.DataFrame,
                                      drug_df: pd.DataFrame) -> pd.DataFrame:
        """Create a clean dataset for drug recommendations."""
        logger.info("Creating drug recommendation dataset...")
        
        # This is a placeholder - implement based on your actual data structure
        recommendation_data = []
        
        # Example mapping (adjust based on your actual data)
        if 'indication' in drug_df.columns:
            for _, row in drug_df.iterrows():
                recommendation_data.append({
                    'drug_name': row.get('drug_name', 'unknown'),
                    'indication': row.get('indication', 'unknown'),
                    'confidence': 1.0  # Placeholder - implement actual confidence scoring
                })
        
        return pd.DataFrame(recommendation_data)
    
    def clean_all_data(self):
        """Main method to clean all data."""
        logger.info("Starting data cleaning process...")
        
        # Load raw drug data
        raw_data_dir = Path("data/raw")
        loaded_files = []
        
        # Load all files in the raw folder
        for file_path in raw_data_dir.glob("*"):
            if file_path.is_file():
                try:
                    if file_path.suffix == '.csv':
                        df = pd.read_csv(file_path, encoding='latin1')
                    elif file_path.suffix == '.tsv':
                        df = pd.read_csv(file_path, sep='\t')
                    elif file_path.suffix == '.json':
                        with open(file_path, 'r') as f:
                            data = json.load(f)
                            if isinstance(data, dict) and 'results' in data:
                                df = pd.DataFrame(data['results'])
                            else:
                                df = pd.DataFrame(data)
                    else:
                        continue
                    
                    loaded_files.append(file_path.name)
                    print(f"\nHead of {file_path.name}:")
                    print(df.head())
                    print(f"\nColumns: {df.columns.tolist()}")
                    print(f"\nDimensions: {df.shape}")
                except Exception as e:
                    logger.error(f"Error loading {file_path.name}: {str(e)}")
        
        print("\nLoaded files:")
        for file_name in loaded_files:
            print(file_name)
        
        return loaded_files
    
    def save_cleaned_data(self, 
                         symptom_disease_df: pd.DataFrame,
                         drug_recommendation_df: pd.DataFrame):
        """Save cleaned data to files."""
        output_dir = Path("data/cleaned")
        output_dir.mkdir(exist_ok=True)
        
        # Save cleaned symptom-disease mapping
        symptom_disease_df.to_csv(output_dir / "cleaned_symptom_disease_mapping.csv", index=False)
        
        # Save cleaned drug recommendations
        drug_recommendation_df.to_csv(output_dir / "cleaned_drug_recommendations.csv", index=False)
        
        logger.info("Cleaned data saved successfully")

if __name__ == "__main__":
    # Initialize cleaner
    cleaner = DataCleaner()
    
    # Clean all data
    loaded_files = cleaner.clean_all_data()
    
    # Print some statistics
    print("\nData Cleaning Statistics:")
    print(f"Number of loaded files: {len(loaded_files)}")
    
    # Print sample of loaded files
    print("\nSample of loaded files:")
    for file_name in loaded_files:
        print(file_name) 