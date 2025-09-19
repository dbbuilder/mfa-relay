#!/usr/bin/env python3
"""
MFARelay - Multi-Factor Authentication Code Relay Service
Monitors email accounts for MFA codes and forwards them via Twilio SMS.

Author: MFARelay Team
Version: 1.0.0
"""

import asyncio
import logging
import signal
import sys
from pathlib import Path
from typing import List

from src.config.config_manager import ConfigManager
from src.email.email_monitor import EmailMonitor
from src.sms.twilio_client import TwilioClient
from src.utils.logger import setup_logger
from src.core.mfa_relay import MFARelay


class MFARelayApp:
    """Main application class for MFARelay service."""
    
    def __init__(self):
        """Initialize the MFARelay application."""
        self.logger = None
        self.config_manager = None
        self.twilio_client = None
        self.email_monitors: List[EmailMonitor] = []
        self.mfa_relay = None
        self.running = False
        
    async def initialize(self) -> bool:
        """
        Initialize all application components.
        
        Returns:
            bool: True if initialization successful, False otherwise
        """
        try:
            # Initialize configuration manager
            self.config_manager = ConfigManager()
            if not await self.config_manager.load_config():
                print("ERROR: Failed to load configuration")
                return False
            
            # Setup logging with configuration
            config = self.config_manager.get_config()
            log_config = config.get('logging', {})
            self.logger = setup_logger(
                name='mfarelay',
                level=log_config.get('level', 'INFO'),
                log_file=log_config.get('file_path'),
                max_bytes=log_config.get('max_bytes', 10485760),  # 10MB default
                backup_count=log_config.get('backup_count', 5)
            )
            
            self.logger.info("Starting MFARelay application")
            
            # Initialize Twilio client
            twilio_config = config.get('twilio', {})
            if not twilio_config:
                self.logger.error("Twilio configuration not found")
                return False
                
            self.twilio_client = TwilioClient(
                account_sid=twilio_config.get('account_sid'),
                auth_token=twilio_config.get('auth_token'),
                from_number=twilio_config.get('from_number'),
                to_number=twilio_config.get('to_number')
            )
            
            # Test Twilio connection
            if not await self.twilio_client.test_connection():
                self.logger.error("Failed to connect to Twilio")
                return False
            
            # Initialize email monitors
            email_accounts = config.get('email_accounts', [])
            if not email_accounts:
                self.logger.error("No email accounts configured")
                return False
            
            for account_config in email_accounts:
                try:
                    monitor = EmailMonitor(config=account_config)
                    if await monitor.test_connection():
                        self.email_monitors.append(monitor)
                        self.logger.info(f"Successfully initialized email monitor for {account_config.get('name', 'Unknown')}")
                    else:
                        self.logger.error(f"Failed to connect to email account: {account_config.get('name', 'Unknown')}")
                except Exception as e:
                    self.logger.error(f"Error initializing email monitor: {e}")
                    continue
            
            if not self.email_monitors:
                self.logger.error("No email monitors successfully initialized")
                return False
            
            # Initialize MFA relay core
            self.mfa_relay = MFARelay(
                config=config,
                email_monitors=self.email_monitors,
                twilio_client=self.twilio_client,
                logger=self.logger
            )
            
            self.logger.info(f"MFARelay initialized successfully with {len(self.email_monitors)} email accounts")
            return True
            
        except Exception as e:
            if self.logger:
                self.logger.error(f"Failed to initialize MFARelay: {e}")
            else:
                print(f"ERROR: Failed to initialize MFARelay: {e}")
            return False
    
    async def start(self):
        """Start the MFARelay service."""
        if not self.mfa_relay:
            self.logger.error("MFARelay not initialized")
            return
        
        try:
            self.running = True
            self.logger.info("Starting MFARelay service")
            
            # Start the main relay service
            await self.mfa_relay.start()
            
        except Exception as e:
            self.logger.error(f"Error starting MFARelay service: {e}")
            raise
    
    async def stop(self):
        """Stop the MFARelay service gracefully."""
        if not self.running:
            return
        
        self.logger.info("Stopping MFARelay service...")
        self.running = False
        
        try:
            # Stop MFA relay core
            if self.mfa_relay:
                await self.mfa_relay.stop()
            
            self.logger.info("MFARelay service stopped successfully")
            
        except Exception as e:
            self.logger.error(f"Error stopping MFARelay service: {e}")
    
    def setup_signal_handlers(self):
        """Setup signal handlers for graceful shutdown."""
        def signal_handler(signum, frame):
            self.logger.info(f"Received signal {signum}, initiating graceful shutdown...")
            asyncio.create_task(self.stop())
        
        signal.signal(signal.SIGINT, signal_handler)
        signal.signal(signal.SIGTERM, signal_handler)


async def main():
    """Main entry point for the MFARelay application."""
    # Create application instance
    app = MFARelayApp()
    
    try:
        # Initialize the application
        if not await app.initialize():
            print("Failed to initialize MFARelay application")
            sys.exit(1)
        
        # Setup signal handlers for graceful shutdown
        app.setup_signal_handlers()
        
        # Start the service
        await app.start()
        
    except KeyboardInterrupt:
        app.logger.info("Received keyboard interrupt, shutting down...")
    except Exception as e:
        if app.logger:
            app.logger.error(f"Unexpected error in main: {e}")
        else:
            print(f"ERROR: Unexpected error in main: {e}")
        sys.exit(1)
    finally:
        # Ensure cleanup
        await app.stop()


if __name__ == "__main__":
    """Run the MFARelay application when executed directly."""
    try:
        # Create necessary directories
        Path("data").mkdir(exist_ok=True)
        Path("logs").mkdir(exist_ok=True)
        
        # Run the application
        asyncio.run(main())
        
    except Exception as e:
        print(f"FATAL ERROR: {e}")
        sys.exit(1)
