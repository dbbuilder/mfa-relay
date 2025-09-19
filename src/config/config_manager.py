"""
Configuration Manager for MFARelay
Handles loading, validation, and management of application configuration.
"""

import os
import yaml
import json
import logging
from pathlib import Path
from typing import Dict, Any, Optional, List
from cryptography.fernet import Fernet
import base64


class ConfigManager:
    """Manages application configuration with validation and encryption support."""
    
    def __init__(self, config_path: str = "config/config.yaml"):
        """
        Initialize the configuration manager.
        
        Args:
            config_path: Path to the configuration file
        """
        self.config_path = Path(config_path)
        self.config: Dict[str, Any] = {}
        self.logger = logging.getLogger(__name__)
        self._encryption_key = None
        
    async def load_config(self) -> bool:
        """
        Load configuration from file with validation.
        
        Returns:
            bool: True if configuration loaded successfully, False otherwise
        """
        try:
            if not self.config_path.exists():
                self.logger.error(f"Configuration file not found: {self.config_path}")
                return False
            
            # Load configuration file
            with open(self.config_path, 'r', encoding='utf-8') as file:
                if self.config_path.suffix.lower() == '.json':
                    self.config = json.load(file)
                else:
                    self.config = yaml.safe_load(file)
            
            # Apply environment variable overrides
            self._apply_environment_overrides()
            
            # Decrypt sensitive values
            await self._decrypt_sensitive_values()
            
            # Validate configuration
            if not self._validate_config():
                return False
            
            self.logger.info("Configuration loaded successfully")
            return True
            
        except yaml.YAMLError as e:
            self.logger.error(f"YAML parsing error in configuration file: {e}")
            return False
        except json.JSONDecodeError as e:
            self.logger.error(f"JSON parsing error in configuration file: {e}")
            return False
        except Exception as e:
            self.logger.error(f"Error loading configuration: {e}")
            return False
    
    def get_config(self) -> Dict[str, Any]:
        """
        Get the complete configuration dictionary.
        
        Returns:
            Dict[str, Any]: The configuration dictionary
        """
        return self.config.copy()
    
    def get_email_accounts(self) -> List[Dict[str, Any]]:
        """
        Get email account configurations.
        
        Returns:
            List[Dict[str, Any]]: List of email account configurations
        """
        return self.config.get('email_accounts', [])
    
    def get_twilio_config(self) -> Dict[str, Any]:
        """
        Get Twilio configuration.
        
        Returns:
            Dict[str, Any]: Twilio configuration
        """
        return self.config.get('twilio', {})
    
    def get_mfa_patterns(self) -> List[str]:
        """
        Get MFA code regex patterns.
        
        Returns:
            List[str]: List of regex patterns for MFA codes
        """
        return self.config.get('mfa_detection', {}).get('patterns', self._get_default_patterns())
    
    def get_check_interval(self) -> int:
        """
        Get email check interval in seconds.
        
        Returns:
            int: Check interval in seconds
        """
        return self.config.get('email_monitoring', {}).get('check_interval', 30)
