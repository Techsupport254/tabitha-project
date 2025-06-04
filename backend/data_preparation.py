import pandas as pd
import json
import numpy as np
from pathlib import Path
import logging
from typing import Dict, List, Tuple

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class DataPreprocessor:
    def __init__(self, data_dir: str = "data/raw"):
        """Initialize the data preprocessor with the data directory path."""
        self.data_dir = Path(data_dir)
        self.processed_data = {}
        
    def load_meddra_data(self) -> Dict[str, pd.DataFrame]:
        """Load and preprocess MedDRA datasets."""
        logger.info("Loading MedDRA datasets...")
        
        meddra_files = {
            'core': 'meddra.tsv',
            'side_effects': 'meddra_all_se.tsv',
            'indications': 'meddra_all_indications.tsv',
            'freq': 'meddra_freq.tsv'
        }
        
        meddra_data = {}
        for key, filename in meddra_files.items():
            try:
                file_path = self.data_dir / filename
                if file_path.exists():
                    # Read TSV files with appropriate column names
                    if key == 'core':
                        df = pd.read_csv(file_path, sep='\t', 
                                       names=['concept_id', 'term_type', 'term_id', 'term'])
                    else:
                        df = pd.read_csv(file_path, sep='\t')
                    
                    # Basic cleaning
                    df = df.dropna()
                    df = df.drop_duplicates()
                    
                    meddra_data[key] = df
                    logger.info(f"Successfully loaded {filename}")
                else:
                    logger.warning(f"File {filename} not found")
            except Exception as e:
                logger.error(f"Error loading {filename}: {str(e)}")
                
        return meddra_data
    
    def load_drug_data(self) -> Dict[str, pd.DataFrame]:
        """Load and preprocess drug-related datasets."""
        logger.info("Loading drug datasets...")
        
        drug_files = {
            'drugs': 'drugsfda.json',
            'ndc': 'ndc_directory.json',
            'labels': 'drug_labels.json',
            'events': 'drug_events.json'
        }
        
        drug_data = {}
        for key, filename in drug_files.items():
            try:
                file_path = self.data_dir / filename
                if file_path.exists():
                    # Read JSON files
                    with open(file_path, 'r') as f:
                        data = json.load(f)
                    
                    # Handle different JSON structures
                    if isinstance(data, dict):
                        # If data has a 'results' key, use that
                        if 'results' in data:
                            df = pd.DataFrame(data['results'])
                        # If data has a 'data' key, use that
                        elif 'data' in data:
                            df = pd.DataFrame(data['data'])
                        else:
                            # Convert the dictionary to a DataFrame
                            df = pd.DataFrame.from_dict(data, orient='index')
                    elif isinstance(data, list):
                        # If data is a list of dictionaries
                        df = pd.DataFrame(data)
                    else:
                        logger.error(f"Unexpected JSON structure in {filename}")
                        continue
                    
                    # Basic cleaning
                    df = df.dropna()
                    df = df.drop_duplicates()
                    
                    drug_data[key] = df
                    logger.info(f"Successfully loaded {filename}")
                else:
                    logger.warning(f"File {filename} not found")
            except Exception as e:
                logger.error(f"Error loading {filename}: {str(e)}")
                
        return drug_data
    
    def create_symptom_disease_mapping(self, meddra_data: Dict[str, pd.DataFrame]) -> pd.DataFrame:
        """Create a mapping between symptoms and diseases using MedDRA data."""
        logger.info("Creating symptom-disease mapping...")
        
        # This is a simplified version - you'll need to expand this based on your specific needs
        if 'core' in meddra_data:
            core_df = meddra_data['core']
            
            # Create symptom-disease pairs (this is a placeholder - you'll need to implement
            # the actual logic based on your medical knowledge and data structure)
            symptom_disease_pairs = []
            
            # Example mapping (you'll need to replace this with actual medical logic)
            for _, row in core_df.iterrows():
                if row['term_type'] == 'PT':  # Preferred Term
                    symptom_disease_pairs.append({
                        'symptom': row['term'],
                        'disease': row['term'],  # This is simplified - you'll need proper disease mapping
                        'concept_id': row['concept_id']
                    })
            
            return pd.DataFrame(symptom_disease_pairs)
        else:
            logger.error("Core MedDRA data not found")
            return pd.DataFrame()
    
    def create_drug_recommendation_data(self, 
                                      meddra_data: Dict[str, pd.DataFrame],
                                      drug_data: Dict[str, pd.DataFrame]) -> pd.DataFrame:
        """Create a dataset for drug recommendations."""
        logger.info("Creating drug recommendation dataset...")
        
        # This is a placeholder - you'll need to implement the actual logic
        # based on your medical knowledge and data structure
        recommendation_data = []
        
        # Example mapping (you'll need to replace this with actual medical logic)
        if 'indications' in meddra_data and 'drugs' in drug_data:
            indications_df = meddra_data['indications']
            drugs_df = drug_data['drugs']
            
            # Create drug-disease pairs (simplified version)
            for _, row in indications_df.iterrows():
                recommendation_data.append({
                    'drug_name': row.get('drug_name', ''),
                    'indication': row.get('indication', ''),
                    'confidence': row.get('confidence', 0.0)
                })
        
        return pd.DataFrame(recommendation_data)
    
    def preprocess_all_data(self) -> Tuple[pd.DataFrame, pd.DataFrame]:
        """Main method to preprocess all data and create training datasets."""
        logger.info("Starting data preprocessing...")
        
        # Load all datasets
        meddra_data = self.load_meddra_data()
        drug_data = self.load_drug_data()
        
        # Create symptom-disease mapping
        symptom_disease_df = self.create_symptom_disease_mapping(meddra_data)
        
        # Create drug recommendation dataset
        drug_recommendation_df = self.create_drug_recommendation_data(meddra_data, drug_data)
        
        # Save processed data
        self.save_processed_data(symptom_disease_df, drug_recommendation_df)
        
        return symptom_disease_df, drug_recommendation_df
    
    def save_processed_data(self, 
                          symptom_disease_df: pd.DataFrame,
                          drug_recommendation_df: pd.DataFrame):
        """Save processed data to files."""
        output_dir = Path("data/processed")
        output_dir.mkdir(exist_ok=True)
        
        # Save symptom-disease mapping
        symptom_disease_df.to_csv(output_dir / "symptom_disease_mapping.csv", index=False)
        
        # Save drug recommendations
        drug_recommendation_df.to_csv(output_dir / "drug_recommendations.csv", index=False)
        
        logger.info("Processed data saved successfully")

if __name__ == "__main__":
    # Initialize preprocessor
    preprocessor = DataPreprocessor()
    
    # Process all data
    symptom_disease_df, drug_recommendation_df = preprocessor.preprocess_all_data()
    
    # Print some statistics
    print("\nData Processing Statistics:")
    print(f"Number of symptom-disease pairs: {len(symptom_disease_df)}")
    print(f"Number of drug recommendations: {len(drug_recommendation_df)}") 