"""
Integration tests for the AI-Assisted Medicine Prescription System.
Tests the interaction between different components of the system.
"""

import pytest
from datetime import datetime, timedelta
import json
from pathlib import Path
import tempfile
import shutil

from src.medication_recommender import MedicationRecommender
from src.patient_history import PatientHistoryManager
from src.inventory_manager import InventoryManager
from src.security_manager import SecurityManager
from src.data_sync import DataSyncManager

@pytest.fixture(scope="function")
def temp_data_dir():
    """Create a temporary directory for test data."""
    temp_dir = tempfile.mkdtemp()
    yield temp_dir
    shutil.rmtree(temp_dir)

@pytest.fixture(scope="function")
def medication_recommender(temp_data_dir):
    """Create a MedicationRecommender instance with test data loaded from drugsfda.json."""
    # Load a sample from drugsfda.json
    with open("data/raw/drugsfda.json", "r") as f:
        drugsfda_data = json.load(f)
    sample_product = drugsfda_data["results"][0]["products"][0]
    med_db = {
        "influenza": [
            {
                "name": sample_product["brand_name"],
                "dosage": sample_product["active_ingredients"][0]["strength"],
                "contraindications": []
            }
        ]
    }
    interaction_db = {
        "ciprofloxacin_aspirin": {
            "severity": "minor",
            "description": "Minor interaction",
            "recommendation": "Monitor"
        }
    }
    med_path = Path(temp_data_dir) / "medications.json"
    int_path = Path(temp_data_dir) / "drug_interactions.json"
    with open(med_path, "w") as f:
        json.dump(med_db, f)
    with open(int_path, "w") as f:
        json.dump(interaction_db, f)
    return MedicationRecommender(temp_data_dir)

@pytest.fixture(scope="function")
def patient_history_manager(temp_data_dir):
    """Create a PatientHistoryManager instance."""
    return PatientHistoryManager(temp_data_dir)

@pytest.fixture(scope="function")
def inventory_manager(temp_data_dir):
    """Create an InventoryManager instance with test data loaded from drugsfda.json."""
    # Load a sample from drugsfda.json
    with open("data/raw/drugsfda.json", "r") as f:
        drugsfda_data = json.load(f)
    sample_product = drugsfda_data["results"][0]["products"][0]
    inv_path = Path(temp_data_dir) / "inventory.json"
    inventory = {
        "MED002": {
            "name": sample_product["brand_name"],
            "quantity": 50,
            "unit": "tablets",
            "expiration_date": (datetime.now() + timedelta(days=365)).isoformat(),
            "reorder_point": 10,
            "supplier": sample_product.get("manufacturer_name", "Unknown"),
            "last_updated": datetime.now().isoformat()
        }
    }
    with open(inv_path, "w") as f:
        json.dump(inventory, f)
    return InventoryManager(temp_data_dir)

@pytest.fixture(scope="function")
def security_manager(temp_data_dir):
    """Create a SecurityManager instance."""
    return SecurityManager(temp_data_dir)

@pytest.fixture(scope="function")
def data_sync_manager(temp_data_dir):
    """Create a DataSyncManager instance."""
    mgr = DataSyncManager(temp_data_dir)
    mgr.start_sync()
    yield mgr
    mgr.stop_sync()

def test_prescription_workflow(
    medication_recommender,
    patient_history_manager,
    inventory_manager,
    security_manager,
    data_sync_manager
):
    """Test the complete prescription workflow."""
    # Create a test patient
    patient_id = "TEST001"
    personal_info = {
        "name": "John Doe",
        "age": 45,
        "gender": "male"
    }
    initial_history = {
        "conditions": ["hypertension"],
        "allergies": ["none"]
    }
    assert patient_history_manager.create_patient_record(
        patient_id,
        personal_info,
        initial_history
    )
    # Get medication recommendations
    recommendations = medication_recommender.get_medication_recommendations(
        disease="influenza",
        patient_history=initial_history,
        allergies={"none"}
    )
    assert len(recommendations) > 0
    # Add medication to inventory for prescription
    inventory_manager.add_medication(
        medication_id="MED001",
        name="Paracetamol",
        quantity=10,
        unit="tablets",
        expiration_date=(datetime.now() + timedelta(days=365)).isoformat(),
        reorder_point=2,
        supplier="Test Supplier"
    )
    # Create prescription
    prescription = {
        "medication": "Paracetamol",
        "dosage": "500mg",
        "frequency": "2x/day",
        "duration": "5 days",
        "quantity": 5,
        "prescribed_at": datetime.now().isoformat()
    }
    assert patient_history_manager.add_prescription(patient_id, prescription)
    assert inventory_manager.update_stock("MED001", -5)
    # Check prescription history
    history = patient_history_manager.get_prescription_history(patient_id)
    assert any(p["medication"] == "Paracetamol" for p in history)

def test_security_and_sync_integration(security_manager, data_sync_manager):
    """Test integration between security and data sync."""
    sensitive_data = {"secret": "value"}
    file_path = Path(security_manager.data_dir) / "secure.json"
    # Encrypt and store
    assert security_manager.secure_store(sensitive_data, file_path)
    # Publish update
    data_sync_manager.publish_update("security", {"action": "store", "file": str(file_path)})
    # Load and decrypt
    loaded = security_manager.secure_load(file_path)
    assert loaded == sensitive_data

def test_inventory_and_prescription_integration(
    inventory_manager,
    medication_recommender,
    data_sync_manager
):
    """Test integration between inventory and prescription components."""
    # Add test medication to inventory
    assert inventory_manager.add_medication(
        medication_id="MED003",
        name="Aspirin",
        quantity=50,
        unit="tablets",
        expiration_date=(datetime.now() + timedelta(days=365)).isoformat(),
        reorder_point=10,
        supplier="Test Supplier"
    )
    # Check for low stock
    low_stock = inventory_manager.get_low_stock_items()
    assert len(low_stock) == 0
    # Update stock to trigger low stock
    assert inventory_manager.update_stock("MED003", -45)
    # Check low stock again
    low_stock = inventory_manager.get_low_stock_items()
    assert len(low_stock) == 1
    assert low_stock[0]["medication_id"] == "MED003"
    # Publish inventory update
    data_sync_manager.publish_update(
        "inventory",
        {
            "action": "low_stock",
            "medication_id": "MED003",
            "current_quantity": 5
        }
    )
    # Wait briefly to ensure update is processed
    import time
    time.sleep(0.2)
    # Get recent updates
    updates = data_sync_manager.get_recent_updates(update_type="inventory")
    assert len(updates) > 0 