"""
Inventory management module.
This module handles tracking and managing medication inventory,
including stock levels, expiration dates, and reorder points.
"""

import json
from pathlib import Path
from typing import Dict, List, Optional
import logging
from datetime import datetime
import pandas as pd

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class InventoryManager:
    def __init__(self, data_dir: str = "data"):
        """Initialize the inventory manager."""
        self.data_dir = Path(data_dir)
        self.inventory_file = self.data_dir / "inventory.json"
        self.inventory = self._load_inventory()
        
    def _load_inventory(self) -> Dict:
        """Load inventory data from file."""
        try:
            if self.inventory_file.exists():
                with open(self.inventory_file, 'r') as f:
                    return json.load(f)
            return {}
        except Exception as e:
            logger.error(f"Error loading inventory: {str(e)}")
            return {}
            
    def _save_inventory(self) -> bool:
        """Save inventory data to file."""
        try:
            with open(self.inventory_file, 'w') as f:
                json.dump(self.inventory, f, indent=2)
            return True
        except Exception as e:
            logger.error(f"Error saving inventory: {str(e)}")
            return False
            
    def add_medication(self,
                      medication_id: str,
                      name: str,
                      quantity: int,
                      unit: str,
                      expiration_date: str,
                      reorder_point: int,
                      supplier: str) -> bool:
        """
        Add a new medication to inventory.
        
        Args:
            medication_id: Unique identifier for the medication
            name: Name of the medication
            quantity: Current quantity in stock
            unit: Unit of measurement (e.g., tablets, ml)
            expiration_date: Expiration date in ISO format
            reorder_point: Quantity at which to reorder
            supplier: Supplier information
            
        Returns:
            bool: True if successful, False otherwise
        """
        try:
            if medication_id in self.inventory:
                logger.warning(f"Medication {medication_id} already exists")
                return False
                
            self.inventory[medication_id] = {
                'name': name,
                'quantity': quantity,
                'unit': unit,
                'expiration_date': expiration_date,
                'reorder_point': reorder_point,
                'supplier': supplier,
                'last_updated': datetime.now().isoformat()
            }
            
            return self._save_inventory()
            
        except Exception as e:
            logger.error(f"Error adding medication: {str(e)}")
            return False
            
    def update_stock(self,
                    medication_id: str,
                    quantity_change: int) -> bool:
        """
        Update medication stock level.
        
        Args:
            medication_id: Unique identifier for the medication
            quantity_change: Amount to add (positive) or remove (negative)
            
        Returns:
            bool: True if successful, False otherwise
        """
        try:
            if medication_id not in self.inventory:
                logger.warning(f"Medication {medication_id} not found")
                return False
                
            current_quantity = self.inventory[medication_id]['quantity']
            new_quantity = current_quantity + quantity_change
            
            if new_quantity < 0:
                logger.warning(f"Insufficient stock for {medication_id}")
                return False
                
            self.inventory[medication_id]['quantity'] = new_quantity
            self.inventory[medication_id]['last_updated'] = datetime.now().isoformat()
            
            return self._save_inventory()
            
        except Exception as e:
            logger.error(f"Error updating stock: {str(e)}")
            return False
            
    def check_stock_level(self, medication_id: str) -> Optional[Dict]:
        """
        Check current stock level and status.
        
        Args:
            medication_id: Unique identifier for the medication
            
        Returns:
            Dict containing stock information or None if not found
        """
        try:
            if medication_id not in self.inventory:
                return None
                
            medication = self.inventory[medication_id]
            current_quantity = medication['quantity']
            reorder_point = medication['reorder_point']
            
            status = "OK"
            if current_quantity <= 0:
                status = "OUT_OF_STOCK"
            elif current_quantity <= reorder_point:
                status = "LOW_STOCK"
                
            return {
                'medication_id': medication_id,
                'name': medication['name'],
                'quantity': current_quantity,
                'unit': medication['unit'],
                'status': status,
                'reorder_point': reorder_point
            }
            
        except Exception as e:
            logger.error(f"Error checking stock level: {str(e)}")
            return None
            
    def get_low_stock_items(self) -> List[Dict]:
        """
        Get list of medications that need reordering.
        
        Returns:
            List of medications with low stock
        """
        try:
            low_stock = []
            for medication_id, medication in self.inventory.items():
                if medication['quantity'] <= medication['reorder_point']:
                    low_stock.append({
                        'medication_id': medication_id,
                        'name': medication['name'],
                        'quantity': medication['quantity'],
                        'unit': medication['unit'],
                        'reorder_point': medication['reorder_point'],
                        'supplier': medication['supplier']
                    })
            return low_stock
            
        except Exception as e:
            logger.error(f"Error getting low stock items: {str(e)}")
            return []
            
    def get_expiring_medications(self, days_threshold: int = 30) -> List[Dict]:
        """
        Get list of medications expiring within specified days.
        
        Args:
            days_threshold: Number of days to check for expiration
            
        Returns:
            List of medications expiring soon
        """
        try:
            expiring = []
            current_date = datetime.now()
            
            for medication_id, medication in self.inventory.items():
                exp_date = datetime.fromisoformat(medication['expiration_date'])
                days_until_expiry = (exp_date - current_date).days
                
                if 0 <= days_until_expiry <= days_threshold:
                    expiring.append({
                        'medication_id': medication_id,
                        'name': medication['name'],
                        'quantity': medication['quantity'],
                        'unit': medication['unit'],
                        'expiration_date': medication['expiration_date'],
                        'days_until_expiry': days_until_expiry
                    })
                    
            return expiring
            
        except Exception as e:
            logger.error(f"Error getting expiring medications: {str(e)}")
            return []
            
    def generate_inventory_report(self) -> pd.DataFrame:
        """
        Generate a comprehensive inventory report.
        
        Returns:
            DataFrame containing inventory information
        """
        try:
            data = []
            for medication_id, medication in self.inventory.items():
                data.append({
                    'Medication ID': medication_id,
                    'Name': medication['name'],
                    'Quantity': medication['quantity'],
                    'Unit': medication['unit'],
                    'Expiration Date': medication['expiration_date'],
                    'Reorder Point': medication['reorder_point'],
                    'Supplier': medication['supplier'],
                    'Last Updated': medication['last_updated']
                })
                
            return pd.DataFrame(data)
            
        except Exception as e:
            logger.error(f"Error generating inventory report: {str(e)}")
            return pd.DataFrame()

    def add_transaction(self, inventory_id: str, transaction_type: str, quantity: int, reference_id: str = None, notes: str = ""):
        """
        Add a transaction record for inventory changes.
        """
        try:
            transactions_file = self.data_dir / "inventory_transactions.json"
            if transactions_file.exists():
                with open(transactions_file, "r") as f:
                    transactions = json.load(f)
            else:
                transactions = []

            transaction = {
                "inventory_id": inventory_id,
                "transaction_type": transaction_type,
                "quantity": quantity,
                "reference_id": reference_id,
                "notes": notes,
                "created_at": datetime.now().isoformat()
            }
            transactions.append(transaction)
            with open(transactions_file, "w") as f:
                json.dump(transactions, f, indent=2)
            return True
        except Exception as e:
            logger.error(f"Error adding inventory transaction: {str(e)}")
            return False 