"""
Email Monitor for MFARelay
Lightweight IMAP-based email monitoring using message flags for state tracking.
"""

import imaplib
import email
import re
import logging
from datetime import datetime, timedelta
from typing import List, Dict, Optional, Tuple
import asyncio
import ssl


class EmailMonitor:
    """Lightweight email monitor that uses IMAP flags instead of database for state tracking."""
    
    def __init__(self, config: Dict[str, str]):
        """
        Initialize email monitor with account configuration.
        
        Args:
            config: Dictionary containing email account configuration
        """
        self.config = config
        self.name = config.get('name', 'Unknown')
        self.host = config['host']
        self.port = int(config['port'])
        self.username = config['username']
        self.password = config['password']
        self.use_ssl = config.get('ssl', True)
        self.folder = config.get('folder', 'INBOX')
        
        self.imap_client: Optional[imaplib.IMAP4] = None
        self.logger = logging.getLogger(f"{__name__}.{self.name}")
        
        # MFA code patterns - optimized for speed
        self.mfa_patterns = [
            # Standard numeric codes (most common)
            r'\b(\d{4,8})\b',
            # Alphanumeric codes
            r'\b([A-Z0-9]{4,8})\b',
            # Specific service patterns for better accuracy
            r'code(?:\s*:?\s*)(\d{4,8})',
            r'verification(?:\s*:?\s*)(\d{4,8})',
            r'authenticate(?:\s*:?\s*)(\d{4,8})',
            r'login(?:\s*:?\s*)(\d{4,8})',
        ]
        
        # Service keywords that indicate MFA emails
        self.mfa_keywords = [
            'verification', 'authenticate', 'login code', 'security code',
            'two-factor', '2fa', 'mfa', 'access code', 'signin code'
        ]
    
    async def connect(self) -> bool:
        """
        Establish connection to email server.
        
        Returns:
            bool: True if connection successful, False otherwise
        """
        try:
            # Create IMAP connection
            if self.use_ssl:
                self.imap_client = imaplib.IMAP4_SSL(self.host, self.port)
            else:
                self.imap_client = imaplib.IMAP4(self.host, self.port)
            
            # Login to account
            self.imap_client.login(self.username, self.password)
            
            # Select folder
            status, messages = self.imap_client.select(self.folder)
            if status != 'OK':
                self.logger.error(f"Failed to select folder {self.folder}")
                return False
            
            self.logger.info(f"Connected to {self.name} successfully")
            return True
            
        except Exception as e:
            self.logger.error(f"Failed to connect to {self.name}: {e}")
            if self.imap_client:
                try:
                    self.imap_client.logout()
                except:
                    pass
                self.imap_client = None
            return False
    
    async def disconnect(self):
        """Close connection to email server."""
        if self.imap_client:
            try:
                self.imap_client.close()
                self.imap_client.logout()
            except Exception as e:
                self.logger.warning(f"Error during disconnect: {e}")
            finally:
                self.imap_client = None
    
    async def check_for_mfa_codes(self) -> List[Dict[str, str]]:
        """
        Check for new MFA codes in email.
        Uses IMAP flags to track processed messages - no database needed.
        
        Returns:
            List[Dict[str, str]]: List of found MFA codes with metadata
        """
        if not self.imap_client:
            self.logger.error("Not connected to email server")
            return []
        
        try:
            # Search for recent unread messages (last 30 minutes)
            cutoff_time = datetime.now() - timedelta(minutes=30)
            date_str = cutoff_time.strftime("%d-%b-%Y")
            
            # Search for unseen messages from today
            search_criteria = f'(UNSEEN SINCE "{date_str}")'
            status, message_ids = self.imap_client.search(None, search_criteria)
            
            if status != 'OK':
                self.logger.warning("Failed to search for messages")
                return []
            
            message_ids = message_ids[0].split()
            if not message_ids:
                return []  # No new messages
            
            self.logger.debug(f"Found {len(message_ids)} unread messages in {self.name}")
            
            mfa_codes = []
            
            for msg_id in message_ids:
                try:
                    # Fetch message
                    status, msg_data = self.imap_client.fetch(msg_id, '(RFC822)')
                    if status != 'OK':
                        continue
                    
                    # Parse email
                    email_body = msg_data[0][1]
                    email_message = email.message_from_bytes(email_body)
                    
                    # Extract relevant info
                    subject = email_message.get('Subject', '')
                    sender = email_message.get('From', '')
                    date_received = email_message.get('Date', '')
                    
                    # Quick pre-filter: check if email likely contains MFA code
                    if not self._is_likely_mfa_email(subject, sender):
                        # Mark as seen to avoid reprocessing
                        self.imap_client.store(msg_id, '+FLAGS', '\\Seen')
                        continue
                    
                    # Extract email content
                    email_content = self._extract_email_content(email_message)
                    if not email_content:
                        # Mark as seen
                        self.imap_client.store(msg_id, '+FLAGS', '\\Seen')
                        continue
                    
                    # Look for MFA codes
                    found_codes = self._extract_mfa_codes(email_content)
                    
                    if found_codes:
                        for code in found_codes:
                            mfa_codes.append({
                                'code': code,
                                'subject': subject,
                                'sender': sender,
                                'account': self.name,
                                'timestamp': datetime.now().isoformat(),
                                'date_received': date_received
                            })
                            
                        self.logger.info(f"Found {len(found_codes)} MFA code(s) in email from {sender}")
                    
                    # Mark message as seen (processed)
                    self.imap_client.store(msg_id, '+FLAGS', '\\Seen')
                    
                except Exception as e:
                    self.logger.error(f"Error processing message {msg_id}: {e}")
                    # Mark as seen even on error to avoid reprocessing
                    try:
                        self.imap_client.store(msg_id, '+FLAGS', '\\Seen')
                    except:
                        pass
                    continue
            
            return mfa_codes
            
        except Exception as e:
            self.logger.error(f"Error checking for MFA codes: {e}")
            return []
    
    def _is_likely_mfa_email(self, subject: str, sender: str) -> bool:
        """
        Quick check to determine if email likely contains MFA code.
        
        Args:
            subject: Email subject line
            sender: Email sender address
            
        Returns:
            bool: True if email likely contains MFA code
        """
        # Convert to lowercase for case-insensitive matching
        subject_lower = subject.lower()
        sender_lower = sender.lower()
        
        # Check for MFA-related keywords in subject
        for keyword in self.mfa_keywords:
            if keyword in subject_lower:
                return True
        
        # Check for common MFA sender patterns
        mfa_sender_patterns = [
            'noreply', 'no-reply', 'security', 'auth', 'verify',
            'google', 'microsoft', 'github', 'aws', 'azure'
        ]
        
        for pattern in mfa_sender_patterns:
            if pattern in sender_lower:
                return True
        
        return False
