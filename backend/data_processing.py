import pandas as pd
import numpy as np
from pathlib import Path
import logging
from typing import Dict, List, Tuple
import json

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class DataProcessor:
    def __init__(self, raw_data_dir: str = "data/raw", processed_data_dir: str = "data/processed"):
        """Initialize the data processor with directory paths."""
        self.raw_data_dir = Path(raw_data_dir)
        self.processed_data_dir = Path(processed_data_dir)
        self.processed_data_dir.mkdir(parents=True, exist_ok=True)
        
    def process_symptom_disease_data(self) -> pd.DataFrame:
        """Process the main symptom-disease dataset (data.csv)."""
        logger.info("Processing symptom-disease dataset...")
        try:
            # Read the CSV file
            df = pd.read_csv(self.raw_data_dir / "data.csv")
            
            # Clean column names
            df.columns = [col.strip() for col in df.columns]
            
            # Ensure the first column is named 'disease'
            df = df.rename(columns={df.columns[0]: 'disease'})
            
            # Remove any duplicate rows
            df = df.drop_duplicates()
            
            # Save processed data
            output_path = self.processed_data_dir / "symptom_disease_mapping.csv"
            df.to_csv(output_path, index=False)
            logger.info(f"Processed symptom-disease data saved to {output_path}")
            
            return df
        except Exception as e:
            logger.error(f"Error processing symptom-disease data: {str(e)}")
            return pd.DataFrame()
    
    def process_drug_data(self) -> pd.DataFrame:
        """Process drug-related data from FDA datasets."""
        logger.info("Processing drug data...")
        try:
            drug_data = {}
            
            # Process drug labels
            if (self.raw_data_dir / "drug_labels.json").exists():
                with open(self.raw_data_dir / "drug_labels.json", 'r') as f:
                    data = json.load(f)
                    if 'results' in data:
                        df_labels = pd.json_normalize(data['results'])
                        drug_data['labels'] = df_labels
            
            # Process drug events
            if (self.raw_data_dir / "drug_events.json").exists():
                with open(self.raw_data_dir / "drug_events.json", 'r') as f:
                    data = json.load(f)
                    if 'results' in data:
                        df_events = pd.json_normalize(data['results'])
                        drug_data['events'] = df_events
            
            # Combine drug data
            if drug_data:
                # Extract relevant columns from labels
                if 'labels' in drug_data:
                    # Get all available columns
                    available_columns = drug_data['labels'].columns.tolist()
                    
                    # Define the columns we want to extract
                    desired_columns = {
                        'brand_name': ['openfda.brand_name', 'brand_name'],
                        'generic_name': ['openfda.generic_name', 'generic_name'],
                        'indications': ['indications_and_usage', 'indications'],
                        'warnings': ['warnings', 'warning'],
                        'dosage': ['dosage_and_administration', 'dosage']
                    }
                    
                    # Create a new DataFrame with the desired structure
                    df_drugs = pd.DataFrame()
                    
                    # Try to find and extract each desired column
                    for new_col, possible_cols in desired_columns.items():
                        for col in possible_cols:
                            if col in available_columns:
                                df_drugs[new_col] = drug_data['labels'][col]
                                break
                    
                    # Add adverse events if available
                    if 'events' in drug_data:
                        event_columns = drug_data['events'].columns.tolist()
                        if 'adverse_reactions' in event_columns:
                            adverse_events = drug_data['events'].groupby('brand_name')[
                                'adverse_reactions'
                            ].agg(list).reset_index()
                            df_drugs = pd.merge(df_drugs, adverse_events, on='brand_name', how='left')
                    
                    # Clean and save
                    df_drugs = df_drugs.dropna(subset=['brand_name', 'generic_name'])
                    output_path = self.processed_data_dir / "drug_info.csv"
                    df_drugs.to_csv(output_path, index=False)
                    logger.info(f"Processed drug data saved to {output_path}")
                    
                    return df_drugs
            
            return pd.DataFrame()
        except Exception as e:
            logger.error(f"Error processing drug data: {str(e)}")
            return pd.DataFrame()
    
    def create_training_dataset(self, 
                              symptom_disease_df: pd.DataFrame,
                              drug_df: pd.DataFrame) -> pd.DataFrame:
        """Create the final training dataset by combining processed data."""
        logger.info("Creating training dataset...")
        try:
            # Create disease-drug mapping based on indications
            disease_drug_mapping = []
            
            for _, row in drug_df.iterrows():
                indications = row['indications']
                # Handle if indications is a list, array, or string
                if isinstance(indications, (list, np.ndarray)):
                    indications_str = ','.join([str(i) for i in indications if pd.notna(i)])
                else:
                    indications_str = str(indications) if pd.notna(indications) else ''
                # Split indications into individual conditions
                conditions = [c.strip() for c in indications_str.lower().split(',') if c.strip()]
                for condition in conditions:
                    disease_drug_mapping.append({
                        'disease': condition,
                        'brand_name': row['brand_name'],
                        'generic_name': row['generic_name'],
                        'dosage': row['dosage'],
                        'warnings': row['warnings']
                    })
            
            # Convert to DataFrame
            df_mapping = pd.DataFrame(disease_drug_mapping)
            
            # Merge with symptom data
            final_dataset = pd.merge(
                df_mapping,
                symptom_disease_df,
                on='disease',
                how='left'
            )
            
            # Clean and save
            final_dataset = final_dataset.dropna(subset=['disease', 'brand_name'])
            output_path = self.processed_data_dir / "training_dataset.csv"
            final_dataset.to_csv(output_path, index=False)
            logger.info(f"Training dataset saved to {output_path}")
            
            return final_dataset
        except Exception as e:
            logger.error(f"Error creating training dataset: {str(e)}")
            return pd.DataFrame()
    
    def process_all_data(self):
        """Process all datasets and create the final training dataset."""
        logger.info("Starting data processing pipeline...")
        
        # Process symptom-disease data
        symptom_disease_df = self.process_symptom_disease_data()
        logger.info(f"Processed {len(symptom_disease_df)} symptom-disease mappings")
        
        # Process drug data
        drug_df = self.process_drug_data()
        logger.info(f"Processed {len(drug_df)} drug records")
        
        # Create final training dataset
        if not symptom_disease_df.empty and not drug_df.empty:
            training_df = self.create_training_dataset(symptom_disease_df, drug_df)
            logger.info(f"Created training dataset with {len(training_df)} records")
        
        logger.info("Data processing complete!")

if __name__ == "__main__":
    # Initialize processor
    processor = DataProcessor()
    
    # Process all data
    processor.process_all_data() 