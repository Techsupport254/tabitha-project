"""
Data synchronization module.
This module handles real-time updates and synchronization of data
across different components of the system.
"""

import json
from pathlib import Path
from typing import Dict, List, Optional, Callable
import logging
from datetime import datetime
import threading
import time
import queue
import hashlib

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class DataSyncManager:
    def __init__(self, data_dir: str = "data"):
        """Initialize the data synchronization manager."""
        self.data_dir = Path(data_dir)
        self.sync_dir = self.data_dir / "sync"
        self.sync_dir.mkdir(parents=True, exist_ok=True)
        
        self.update_queue = queue.Queue()
        self.subscribers: Dict[str, List[Callable]] = {}
        self.running = False
        self.sync_thread = None
        
    def start_sync(self):
        """Start the synchronization thread."""
        if self.running:
            return
            
        self.running = True
        self.sync_thread = threading.Thread(target=self._sync_worker)
        self.sync_thread.daemon = True
        self.sync_thread.start()
        logger.info("Data synchronization started")
        
    def stop_sync(self):
        """Stop the synchronization thread."""
        self.running = False
        if self.sync_thread:
            self.sync_thread.join()
        logger.info("Data synchronization stopped")
        
    def _sync_worker(self):
        """Worker thread for processing updates."""
        while self.running:
            try:
                update = self.update_queue.get(timeout=1)
                self._process_update(update)
                self.update_queue.task_done()
            except queue.Empty:
                continue
            except Exception as e:
                logger.error(f"Error in sync worker: {str(e)}")
                
    def _process_update(self, update: Dict):
        """
        Process a single update.
        
        Args:
            update: Dictionary containing update information
        """
        try:
            update_type = update.get('type')
            if not update_type:
                return
                
            # Notify subscribers
            if update_type in self.subscribers:
                for callback in self.subscribers[update_type]:
                    try:
                        callback(update)
                    except Exception as e:
                        logger.error(f"Error in subscriber callback: {str(e)}")
                        
            # Save update to sync directory
            timestamp = datetime.now().isoformat()
            update_id = hashlib.md5(f"{update_type}{timestamp}".encode()).hexdigest()
            update_file = self.sync_dir / f"{update_id}.json"
            
            with open(update_file, 'w') as f:
                json.dump({
                    'id': update_id,
                    'timestamp': timestamp,
                    'update': update
                }, f, indent=2)
                
        except Exception as e:
            logger.error(f"Error processing update: {str(e)}")
            
    def subscribe(self, update_type: str, callback: Callable):
        """
        Subscribe to updates of a specific type.
        
        Args:
            update_type: Type of updates to subscribe to
            callback: Function to call when update is received
        """
        if update_type not in self.subscribers:
            self.subscribers[update_type] = []
        self.subscribers[update_type].append(callback)
        
    def unsubscribe(self, update_type: str, callback: Callable):
        """
        Unsubscribe from updates of a specific type.
        
        Args:
            update_type: Type of updates to unsubscribe from
            callback: Function to remove from subscribers
        """
        if update_type in self.subscribers:
            self.subscribers[update_type].remove(callback)
            
    def publish_update(self, update_type: str, data: Dict):
        """
        Publish an update to the system.
        
        Args:
            update_type: Type of update
            data: Update data
        """
        try:
            update = {
                'type': update_type,
                'data': data,
                'timestamp': datetime.now().isoformat()
            }
            self.update_queue.put(update)
        except Exception as e:
            logger.error(f"Error publishing update: {str(e)}")
            
    def get_recent_updates(self,
                         update_type: Optional[str] = None,
                         limit: int = 100) -> List[Dict]:
        """
        Get recent updates from the system.
        
        Args:
            update_type: Optional filter for update type
            limit: Maximum number of updates to return
            
        Returns:
            List of recent updates
        """
        try:
            updates = []
            update_files = sorted(
                self.sync_dir.glob("*.json"),
                key=lambda x: x.stat().st_mtime,
                reverse=True
            )
            
            for file in update_files[:limit]:
                try:
                    with open(file, 'r') as f:
                        update_data = json.load(f)
                        if update_type is None or update_data['update']['type'] == update_type:
                            updates.append(update_data)
                except Exception as e:
                    logger.error(f"Error reading update file {file}: {str(e)}")
                    
            return updates
            
        except Exception as e:
            logger.error(f"Error getting recent updates: {str(e)}")
            return []
            
    def clear_old_updates(self, days: int = 30):
        """
        Clear updates older than specified days.
        
        Args:
            days: Number of days to keep updates
        """
        try:
            cutoff = datetime.now().timestamp() - (days * 24 * 60 * 60)
            
            for file in self.sync_dir.glob("*.json"):
                if file.stat().st_mtime < cutoff:
                    try:
                        file.unlink()
                    except Exception as e:
                        logger.error(f"Error deleting old update file {file}: {str(e)}")
                        
        except Exception as e:
            logger.error(f"Error clearing old updates: {str(e)}")
            
    def get_update_stats(self) -> Dict:
        """
        Get statistics about updates in the system.
        
        Returns:
            Dictionary containing update statistics
        """
        try:
            stats = {
                'total_updates': 0,
                'updates_by_type': {},
                'oldest_update': None,
                'newest_update': None
            }
            
            for file in self.sync_dir.glob("*.json"):
                try:
                    with open(file, 'r') as f:
                        update_data = json.load(f)
                        update_type = update_data['update']['type']
                        
                        stats['total_updates'] += 1
                        stats['updates_by_type'][update_type] = stats['updates_by_type'].get(update_type, 0) + 1
                        
                        timestamp = datetime.fromisoformat(update_data['timestamp'])
                        if stats['oldest_update'] is None or timestamp < stats['oldest_update']:
                            stats['oldest_update'] = timestamp
                        if stats['newest_update'] is None or timestamp > stats['newest_update']:
                            stats['newest_update'] = timestamp
                            
                except Exception as e:
                    logger.error(f"Error reading update file {file}: {str(e)}")
                    
            return stats
            
        except Exception as e:
            logger.error(f"Error getting update stats: {str(e)}")
            return {} 