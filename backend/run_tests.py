"""
Test runner for the disease prediction model.
This script evaluates the model's performance using various test cases.
"""

import logging
from test_cases import TEST_CASES, NEGATION_TEST_CASES, CASUAL_TEST_CASES, COMPLEX_TEST_CASES
from test_model import DiseasePredictorTester
from sklearn.metrics import precision_score, recall_score, f1_score
import numpy as np
from typing import List, Dict, Set, Tuple
import json
from datetime import datetime

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class ModelTester:
    def __init__(self):
        """Initialize the model tester."""
        self.tester = DiseasePredictorTester()
        self.tester.load_model()
        self.results = {
            'timestamp': datetime.now().isoformat(),
            'test_cases': [],
            'summary': {}
        }

    def evaluate_symptom_detection(self, detected_symptoms: Set[str], expected_symptoms: Set[str]) -> Dict[str, float]:
        """Evaluate symptom detection performance."""
        # Convert sets to binary vectors for metric calculation
        all_symptoms = list(self.tester.feature_names)
        y_true = np.array([1 if s in expected_symptoms else 0 for s in all_symptoms])
        y_pred = np.array([1 if s in detected_symptoms else 0 for s in all_symptoms])
        
        return {
            'precision': precision_score(y_true, y_pred, zero_division=0),
            'recall': recall_score(y_true, y_pred, zero_division=0),
            'f1': f1_score(y_true, y_pred, zero_division=0)
        }

    def evaluate_disease_prediction(self, predicted_diseases: List[Tuple[str, float]], expected_diseases: List[str]) -> Dict[str, float]:
        """Evaluate disease prediction performance."""
        # Check if any expected disease is in top 3 predictions
        top_3_diseases = [d[0].lower() for d in predicted_diseases[:3]]
        expected_diseases = [d.lower() for d in expected_diseases]
        
        hits = sum(1 for d in expected_diseases if d in top_3_diseases)
        return {
            'top_3_hit_rate': hits / len(expected_diseases) if expected_diseases else 0
        }

    def run_test_case(self, test_case: Dict) -> Dict:
        """Run a single test case and return results."""
        logger.info(f"\nTesting case: {test_case['description'][:100]}...")
        
        # Get predictions
        detected_symptoms, predicted_diseases = self.tester.predict_from_text(test_case['description'])
        
        # Evaluate results
        symptom_metrics = self.evaluate_symptom_detection(detected_symptoms, test_case['expected_symptoms'])
        disease_metrics = self.evaluate_disease_prediction(predicted_diseases, test_case.get('expected_diseases', []))
        
        # Prepare result
        result = {
            'description': test_case['description'],
            'expected_symptoms': list(test_case['expected_symptoms']),
            'detected_symptoms': list(detected_symptoms),
            'symptom_metrics': symptom_metrics,
            'predicted_diseases': [(d, float(p)) for d, p in predicted_diseases[:3]],
            'disease_metrics': disease_metrics
        }
        
        if 'expected_diseases' in test_case:
            result['expected_diseases'] = test_case['expected_diseases']
        
        return result

    def run_test_suite(self, test_cases: List[Dict], suite_name: str) -> List[Dict]:
        """Run a suite of test cases."""
        logger.info(f"\nRunning {suite_name}...")
        results = []
        
        for test_case in test_cases:
            result = self.run_test_case(test_case)
            results.append(result)
            
            # Log results
            logger.info(f"\nSymptom Detection:")
            logger.info(f"Expected: {result['expected_symptoms']}")
            logger.info(f"Detected: {result['detected_symptoms']}")
            logger.info(f"Precision: {result['symptom_metrics']['precision']:.2f}")
            logger.info(f"Recall: {result['symptom_metrics']['recall']:.2f}")
            logger.info(f"F1 Score: {result['symptom_metrics']['f1']:.2f}")
            
            if 'expected_diseases' in result:
                logger.info(f"\nDisease Prediction:")
                logger.info(f"Expected: {result['expected_diseases']}")
                logger.info(f"Predicted: {[d[0] for d in result['predicted_diseases']]}")
                logger.info(f"Top-3 Hit Rate: {result['disease_metrics']['top_3_hit_rate']:.2f}")
        
        return results

    def calculate_summary(self, all_results: List[Dict]) -> Dict:
        """Calculate summary statistics for all test results."""
        symptom_metrics = {
            'precision': np.mean([r['symptom_metrics']['precision'] for r in all_results]),
            'recall': np.mean([r['symptom_metrics']['recall'] for r in all_results]),
            'f1': np.mean([r['symptom_metrics']['f1'] for r in all_results])
        }
        
        disease_metrics = {
            'top_3_hit_rate': np.mean([r['disease_metrics']['top_3_hit_rate'] for r in all_results])
        }
        
        return {
            'symptom_metrics': symptom_metrics,
            'disease_metrics': disease_metrics,
            'total_test_cases': len(all_results)
        }

    def save_results(self, filename: str = 'test_results.json'):
        """Save test results to a JSON file."""
        with open(filename, 'w') as f:
            json.dump(self.results, f, indent=2)
        logger.info(f"\nResults saved to {filename}")

    def run_all_tests(self):
        """Run all test suites and generate a comprehensive report."""
        # Run all test suites
        basic_results = self.run_test_suite(TEST_CASES, "Basic Test Cases")
        negation_results = self.run_test_suite(NEGATION_TEST_CASES, "Negation Test Cases")
        casual_results = self.run_test_suite(CASUAL_TEST_CASES, "Casual Language Test Cases")
        complex_results = self.run_test_suite(COMPLEX_TEST_CASES, "Complex Test Cases")
        
        # Combine all results
        all_results = basic_results + negation_results + casual_results + complex_results
        
        # Calculate summary
        self.results['summary'] = self.calculate_summary(all_results)
        
        # Save results
        self.save_results()
        
        # Print summary
        logger.info("\n=== Test Summary ===")
        logger.info(f"Total Test Cases: {self.results['summary']['total_test_cases']}")
        logger.info("\nSymptom Detection Metrics:")
        logger.info(f"Average Precision: {self.results['summary']['symptom_metrics']['precision']:.2f}")
        logger.info(f"Average Recall: {self.results['summary']['symptom_metrics']['recall']:.2f}")
        logger.info(f"Average F1 Score: {self.results['summary']['symptom_metrics']['f1']:.2f}")
        logger.info("\nDisease Prediction Metrics:")
        logger.info(f"Average Top-3 Hit Rate: {self.results['summary']['disease_metrics']['top_3_hit_rate']:.2f}")

def main():
    """Main function to run all tests."""
    tester = ModelTester()
    tester.run_all_tests()

if __name__ == "__main__":
    main() 