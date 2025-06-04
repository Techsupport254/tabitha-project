"""
Security management module.
This module handles encryption, decryption, and secure storage of sensitive data.
"""

import json
from pathlib import Path
from typing import Dict, Any, Optional
import logging
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
import base64
import os
import hashlib

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class SecurityManager:
    def __init__(self, data_dir: str = "data"):
        """Initialize the security manager."""
        self.data_dir = Path(data_dir)
        self.keys_dir = self.data_dir / "keys"
        self.keys_dir.mkdir(parents=True, exist_ok=True)
        self.key = self._load_or_generate_key()
        self.fernet = Fernet(self.key)
        
    def _load_or_generate_key(self) -> bytes:
        """Load existing key or generate a new one."""
        key_file = self.keys_dir / "encryption.key"
        
        if key_file.exists():
            try:
                with open(key_file, 'rb') as f:
                    return f.read()
            except Exception as e:
                logger.error(f"Error loading key: {str(e)}")
                
        # Generate new key
        key = Fernet.generate_key()
        try:
            with open(key_file, 'wb') as f:
                f.write(key)
        except Exception as e:
            logger.error(f"Error saving key: {str(e)}")
            
        return key
        
    def _derive_key(self, password: str, salt: Optional[bytes] = None) -> bytes:
        """
        Derive encryption key from password.
        
        Args:
            password: Password to derive key from
            salt: Optional salt for key derivation
            
        Returns:
            Derived key bytes
        """
        if salt is None:
            salt = os.urandom(16)
            
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=salt,
            iterations=100000,
        )
        
        key = base64.urlsafe_b64encode(kdf.derive(password.encode()))
        return key
        
    def encrypt_data(self, data: Dict[str, Any]) -> Optional[bytes]:
        """
        Encrypt sensitive data.
        
        Args:
            data: Dictionary containing data to encrypt
            
        Returns:
            Encrypted data bytes or None if encryption fails
        """
        try:
            json_data = json.dumps(data)
            return self.fernet.encrypt(json_data.encode())
        except Exception as e:
            logger.error(f"Error encrypting data: {str(e)}")
            return None
            
    def decrypt_data(self, encrypted_data: bytes) -> Optional[Dict[str, Any]]:
        """
        Decrypt encrypted data.
        
        Args:
            encrypted_data: Encrypted data bytes
            
        Returns:
            Decrypted data dictionary or None if decryption fails
        """
        try:
            decrypted_data = self.fernet.decrypt(encrypted_data)
            return json.loads(decrypted_data.decode())
        except Exception as e:
            logger.error(f"Error decrypting data: {str(e)}")
            return None
            
    def secure_store(self,
                    data: Dict[str, Any],
                    file_path: str) -> bool:
        """
        Securely store encrypted data to file.
        
        Args:
            data: Dictionary containing data to store
            file_path: Path to store the encrypted data
            
        Returns:
            bool: True if successful, False otherwise
        """
        try:
            encrypted_data = self.encrypt_data(data)
            if encrypted_data is None:
                return False
                
            with open(file_path, 'wb') as f:
                f.write(encrypted_data)
                
            return True
            
        except Exception as e:
            logger.error(f"Error storing encrypted data: {str(e)}")
            return False
            
    def secure_load(self, file_path: str) -> Optional[Dict[str, Any]]:
        """
        Load and decrypt data from file.
        
        Args:
            file_path: Path to the encrypted data file
            
        Returns:
            Decrypted data dictionary or None if loading fails
        """
        try:
            with open(file_path, 'rb') as f:
                encrypted_data = f.read()
                
            return self.decrypt_data(encrypted_data)
            
        except Exception as e:
            logger.error(f"Error loading encrypted data: {str(e)}")
            return None
            
    def hash_password(self, password: str) -> str:
        """
        Hash password for secure storage.
        
        Args:
            password: Password to hash
            
        Returns:
            Hashed password string
        """
        salt = os.urandom(32)
        key = hashlib.pbkdf2_hmac(
            'sha256',
            password.encode('utf-8'),
            salt,
            100000
        )
        return base64.b64encode(salt + key).decode('utf-8')
        
    def verify_password(self, password: str, hashed_password: str) -> bool:
        """
        Verify password against stored hash.
        
        Args:
            password: Password to verify
            hashed_password: Stored hashed password
            
        Returns:
            bool: True if password matches, False otherwise
        """
        try:
            stored = base64.b64decode(hashed_password)
            salt = stored[:32]
            key = stored[32:]
            
            new_key = hashlib.pbkdf2_hmac(
                'sha256',
                password.encode('utf-8'),
                salt,
                100000
            )
            
            return key == new_key
            
        except Exception as e:
            logger.error(f"Error verifying password: {str(e)}")
            return False
            
    def secure_delete(self, file_path: str) -> bool:
        """
        Securely delete a file by overwriting with random data.
        
        Args:
            file_path: Path to the file to delete
            
        Returns:
            bool: True if successful, False otherwise
        """
        try:
            if not os.path.exists(file_path):
                return True
                
            # Overwrite file with random data
            file_size = os.path.getsize(file_path)
            with open(file_path, 'wb') as f:
                f.write(os.urandom(file_size))
                
            # Delete the file
            os.remove(file_path)
            return True
            
        except Exception as e:
            logger.error(f"Error securely deleting file: {str(e)}")
            return False 