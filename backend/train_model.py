import pandas as pd
import numpy as np
import os
from pathlib import Path
from sklearn.model_selection import train_test_split, GridSearchCV, cross_val_score
from xgboost import XGBClassifier
from sklearn.metrics import classification_report, accuracy_score, confusion_matrix
import joblib
import logging
import seaborn as sns
import matplotlib.pyplot as plt
from typing import Dict, Tuple, Any

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class DiseasePredictor:
    def __init__(self, data_path: str = "data/processed/training_dataset.csv"):
        """Initialize the disease predictor model.
        
        Args:
            data_path (str): Path to the training dataset
        """
        self.data_path = Path(data_path)
        self.model = None
        self.feature_names = None
        self.label_names = None
        self.best_params = None
        
    def load_data(self) -> Tuple[pd.DataFrame, pd.Series, np.ndarray]:
        """Load and prepare the training data.
        
        Returns:
            Tuple[pd.DataFrame, pd.Series, np.ndarray]: Features, encoded labels, and label names
        """
        logger.info(f"Loading data from {self.data_path}")
        try:
            df = pd.read_csv(self.data_path)
            
            # Clean disease labels: remove rows with invalid/nonsensical disease names
            def is_valid_disease(label):
                if not isinstance(label, str):
                    return False
                label = label.strip()
                # Exclude empty, too short, too long, or non-alphabetic labels
                if len(label) < 3 or len(label) > 50:
                    return False
                if not any(c.isalpha() for c in label):
                    return False
                # Exclude labels with generic instructions or warnings
                bad_phrases = [
                    'should be considered', 'modifying antibacterial therapy',
                    'risk of skin cancer', 'caused by the sun', 'abuse',
                    'consult your doctor', 'see package insert', 'not for use',
                    'keep out of reach', 'for external use only', 'if pregnant',
                    'do not use', 'stop use', 'ask a doctor', 'children under',
                    'in case of overdose', 'if swallowed', 'get medical help',
                    'store at room temperature', 'use only as directed',
                    'for medical emergencies', 'call poison control', 'not intended',
                    'read all warnings', 'use with caution', 'side effects may include'
                ]
                for phrase in bad_phrases:
                    if phrase in label.lower():
                        return False
                return True

            before = len(df)
            df = df[df['disease'].apply(is_valid_disease)]
            after = len(df)
            if after < before:
                logger.warning(f"Removed {before - after} rows with invalid disease labels.")

            # Prepare features and labels
            symptom_cols = [col for col in df.columns 
                          if col not in ["disease", "brand_name", "generic_name", 
                                       "dosage", "warnings"]]
            
            X = df[symptom_cols].fillna(0).astype(int)
            y = df["disease"].astype(str)
            
            # Encode labels
            y_encoded, label_names = pd.factorize(y)
            
            # Filter out rare classes (diseases with <5 samples)
            counts = pd.Series(y_encoded).value_counts()
            valid_classes = counts[counts >= 5].index  # Increased minimum samples threshold
            mask = pd.Series(y_encoded).isin(valid_classes)
            
            # Log information about removed classes
            removed_classes = counts[counts < 5]
            if not removed_classes.empty:
                logger.warning(f"Removed {len(removed_classes)} classes with fewer than 5 samples")
                logger.warning("Removed classes and their counts:")
                for label, count in removed_classes.items():
                    logger.warning(f"- {label_names[label]}: {count} samples")
            
            # Apply mask to both X and y_encoded (ensure alignment)
            mask = mask.values  # Fix alignment issue
            X = X[mask]
            y_encoded = y_encoded[mask]
            
            # Re-factorize after filtering to ensure contiguous labels
            y_encoded, label_names = pd.factorize(label_names[y_encoded])
            self.label_names = label_names
            self.feature_names = symptom_cols
            logger.info(f"Loaded {len(X)} samples with {len(self.label_names)} unique diseases")
            
            return X, y_encoded, label_names
            
        except Exception as e:
            logger.error(f"Error loading data: {str(e)}")
            raise
    
    def train_model(self, X: pd.DataFrame, y: pd.Series) -> None:
        """Train the disease prediction model with hyperparameter tuning.
        
        Args:
            X (pd.DataFrame): Training features
            y (pd.Series): Training labels
        """
        logger.info("Starting model training with hyperparameter tuning")
        
        # Define a smaller hyperparameter grid for XGBoost
        param_grid = {
            'n_estimators': [100, 200],
            'max_depth': [3, 5],
            'learning_rate': [0.1],
            'subsample': [0.8, 1.0],
            'colsample_bytree': [0.8, 1.0],
            'min_child_weight': [1, 3]
        }
        
        # Initialize base model with early stopping
        base_model = XGBClassifier(
            random_state=42,
            n_jobs=-1,
            early_stopping_rounds=10,
            eval_metric='mlogloss'
        )
        
        # Split data for early stopping (no stratification to avoid errors)
        X_train, X_val, y_train, y_val = train_test_split(
            X, y, test_size=0.2, random_state=42
        )
        
        # Perform grid search with fewer CV folds
        grid_search = GridSearchCV(
            estimator=base_model,
            param_grid=param_grid,
            cv=3,
            scoring='accuracy',
            n_jobs=-1,
            verbose=1
        )
        
        # Fit the model with early stopping
        grid_search.fit(
            X_train, y_train,
            eval_set=[(X_val, y_val)],
            verbose=False
        )
        
        # Get best model and parameters
        self.model = grid_search.best_estimator_
        self.best_params = grid_search.best_params_
        logger.info(f"Best parameters found: {self.best_params}")
        
        # For cross-validation, use a new model without early stopping
        cv_model = XGBClassifier(
            random_state=42,
            n_jobs=-1,
            eval_metric='mlogloss',
            **self.best_params
        )
        cv_scores = cross_val_score(cv_model, X, y, cv=3)
        logger.info(f"Cross-validation scores: {cv_scores}")
        logger.info(f"Mean CV score: {cv_scores.mean():.3f} (+/- {cv_scores.std() * 2:.3f})")
        
        # Plot feature importance
        self.plot_feature_importance(X)
    
    def plot_feature_importance(self, X: pd.DataFrame) -> None:
        """Plot feature importance from the trained model.
        
        Args:
            X (pd.DataFrame): Training features
        """
        # Get feature importance
        importance = self.model.feature_importances_
        feature_importance = pd.DataFrame({
            'feature': self.feature_names,
            'importance': importance
        })
        
        # Sort by importance
        feature_importance = feature_importance.sort_values('importance', ascending=False)
        
        # Plot top 20 features
        plt.figure(figsize=(12, 6))
        sns.barplot(x='importance', y='feature', data=feature_importance.head(20))
        plt.title('Top 20 Most Important Features')
        plt.xlabel('Importance')
        plt.ylabel('Feature')
        plt.tight_layout()
        
        # Save plot
        output_dir = Path("src/model")
        output_dir.mkdir(parents=True, exist_ok=True)
        plt.savefig(output_dir / "feature_importance.png")
        plt.close()
    
    def evaluate_model(self, X_test: pd.DataFrame, y_test: pd.Series, label_names: np.ndarray) -> Dict[str, float]:
        """Evaluate the trained model on test data.
        
        Args:
            X_test (pd.DataFrame): Test features
            y_test (pd.Series): Test labels
            label_names (np.ndarray): Names of the labels/classes
            
        Returns:
            Dict[str, float]: Dictionary of evaluation metrics
        """
        logger.info("Evaluating model on test set")
        
        # Make predictions
        y_pred = self.model.predict(X_test)
        
        # Calculate metrics
        accuracy = accuracy_score(y_test, y_pred)
        labels = np.unique(np.concatenate([y_test, y_pred]))
        report = classification_report(y_test, y_pred, 
                                     labels=labels,
                                     target_names=label_names[labels],
                                     output_dict=True)
        
        # Create confusion matrix
        cm = confusion_matrix(y_test, y_pred, labels=labels)
        plt.figure(figsize=(15, 15))
        sns.heatmap(cm, annot=True, fmt='d', cmap='Blues',
                    xticklabels=label_names[labels],
                    yticklabels=label_names[labels])
        plt.title('Confusion Matrix')
        plt.xlabel('Predicted')
        plt.ylabel('True')
        plt.xticks(rotation=45, ha='right')
        plt.yticks(rotation=45)
        plt.tight_layout()
        
        # Save confusion matrix plot
        output_dir = Path("src/model")
        output_dir.mkdir(parents=True, exist_ok=True)
        plt.savefig(output_dir / "confusion_matrix.png")
        
        logger.info(f"Test set accuracy: {accuracy:.3f}")
        logger.info("\nClassification Report:")
        logger.info(classification_report(y_test, y_pred, 
                                        labels=labels,
                                        target_names=label_names[labels]))
        
        return {
            'accuracy': accuracy,
            'classification_report': report
        }
    
    def save_model(self, output_path: str = "src/model/disease_predictor.pkl") -> None:
        """Save the trained model and associated data.
        
        Args:
            output_path (str): Path to save the model
        """
        logger.info(f"Saving model to {output_path}")
        
        # Create output directory if it doesn't exist
        output_dir = Path(output_path).parent
        output_dir.mkdir(parents=True, exist_ok=True)
        
        # Save model and associated data
        model_data = {
            'model': self.model,
            'feature_names': self.feature_names,
            'label_names': self.label_names,
            'best_params': self.best_params
        }
        
        joblib.dump(model_data, output_path)
        logger.info("Model saved successfully")

def main():
    """Main function to run the model training pipeline."""
    try:
        # Initialize predictor
        predictor = DiseasePredictor()
        
        # Load and prepare data
        X, y, label_names = predictor.load_data()
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42, stratify=y
        )
        
        # Train model
        predictor.train_model(X_train, y_train)
        
        # Evaluate model
        metrics = predictor.evaluate_model(X_test, y_test, label_names)
        
        # Save model
        predictor.save_model()
        
        logger.info("Model training pipeline completed successfully")
        
    except Exception as e:
        logger.error(f"Error in model training pipeline: {str(e)}")
        raise

if __name__ == "__main__":
    main() 