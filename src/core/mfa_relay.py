"""
MFA Relay Core Service
Orchestrates email monitoring and SMS forwarding with multi-user support.
"""

import asyncio
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta

from src.email.email_monitor import EmailMonitor
from src.sms.twilio_client import TwilioClient


class MFARelay:
    """Core MFA Relay service that orchestrates email monitoring and SMS forwarding."""

    def __init__(self, config: Dict[str, Any], email_monitors: List[EmailMonitor],
                 twilio_client: TwilioClient, logger: logging.Logger):
        """
        Initialize MFA Relay core service.

        Args:
            config: Application configuration
            email_monitors: List of configured email monitors
            twilio_client: Twilio SMS client
            logger: Logger instance
        """
        self.config = config
        self.email_monitors = email_monitors
        self.twilio_client = twilio_client
        self.logger = logger

        self.running = False
        self.monitoring_tasks: List[asyncio.Task] = []

        # Configuration
        self.check_interval = config.get('email_monitoring', {}).get('check_interval', 30)
        self.max_concurrent_checks = config.get('email_monitoring', {}).get('max_concurrent_checks', 5)

        # Rate limiting
        self.last_code_times: Dict[str, datetime] = {}
        self.min_code_interval = timedelta(seconds=30)  # Prevent duplicate codes

    async def start(self):
        """Start the MFA relay service."""
        if self.running:
            self.logger.warning("MFA Relay already running")
            return

        self.running = True
        self.logger.info("Starting MFA Relay core service")

        try:
            # Start monitoring tasks for each email account
            semaphore = asyncio.Semaphore(self.max_concurrent_checks)

            for monitor in self.email_monitors:
                task = asyncio.create_task(
                    self._monitor_email_account(monitor, semaphore)
                )
                self.monitoring_tasks.append(task)

            self.logger.info(f"Started {len(self.monitoring_tasks)} email monitoring tasks")

            # Keep service running
            while self.running:
                await asyncio.sleep(1)

        except Exception as e:
            self.logger.error(f"Error in MFA Relay service: {e}")
            raise
        finally:
            await self.stop()

    async def stop(self):
        """Stop the MFA relay service gracefully."""
        if not self.running:
            return

        self.logger.info("Stopping MFA Relay core service...")
        self.running = False

        # Cancel all monitoring tasks
        for task in self.monitoring_tasks:
            if not task.done():
                task.cancel()

        # Wait for tasks to complete
        if self.monitoring_tasks:
            await asyncio.gather(*self.monitoring_tasks, return_exceptions=True)

        # Disconnect all email monitors
        for monitor in self.email_monitors:
            await monitor.disconnect()

        self.monitoring_tasks.clear()
        self.logger.info("MFA Relay core service stopped")

    async def _monitor_email_account(self, monitor: EmailMonitor, semaphore: asyncio.Semaphore):
        """
        Monitor a single email account for MFA codes.

        Args:
            monitor: Email monitor instance
            semaphore: Semaphore for limiting concurrent checks
        """
        self.logger.info(f"Starting monitoring for email account: {monitor.name}")

        while self.running:
            async with semaphore:
                try:
                    # Check for MFA codes
                    mfa_codes = await monitor.check_for_mfa_codes()

                    for code_data in mfa_codes:
                        await self._process_mfa_code(code_data, monitor.name)

                except Exception as e:
                    self.logger.error(f"Error monitoring {monitor.name}: {e}")

                    # Try to reconnect if connection lost
                    try:
                        await monitor.disconnect()
                        await asyncio.sleep(5)
                        if await monitor.connect():
                            self.logger.info(f"Reconnected to {monitor.name}")
                        else:
                            self.logger.error(f"Failed to reconnect to {monitor.name}")
                    except Exception as reconnect_error:
                        self.logger.error(f"Reconnection failed for {monitor.name}: {reconnect_error}")

            # Wait before next check
            await asyncio.sleep(self.check_interval)

        self.logger.info(f"Stopped monitoring for email account: {monitor.name}")

    async def _process_mfa_code(self, code_data: Dict[str, str], account_name: str):
        """
        Process detected MFA code and send via SMS.

        Args:
            code_data: Dictionary containing MFA code and metadata
            account_name: Name of the email account
        """
        code = code_data.get('code', '')
        sender = code_data.get('sender', '')
        subject = code_data.get('subject', '')

        if not code:
            self.logger.warning(f"Empty MFA code from {account_name}")
            return

        # Rate limiting: prevent duplicate codes
        code_key = f"{code}:{sender}"
        now = datetime.now()

        if code_key in self.last_code_times:
            time_diff = now - self.last_code_times[code_key]
            if time_diff < self.min_code_interval:
                self.logger.debug(f"Skipping duplicate code {code} (sent {time_diff.seconds}s ago)")
                return

        self.last_code_times[code_key] = now

        # Clean up old entries (keep only last hour)
        cutoff_time = now - timedelta(hours=1)
        self.last_code_times = {
            k: v for k, v in self.last_code_times.items()
            if v > cutoff_time
        }

        self.logger.info(f"Processing MFA code: {code} from {sender} via {account_name}")

        try:
            # Determine service name from sender or subject
            service_name = self._extract_service_name(sender, subject)

            # Send SMS
            success = await self.twilio_client.send_mfa_code(code, service_name)

            if success:
                self.logger.info(f"Successfully sent MFA code {code} via SMS")
            else:
                self.logger.error(f"Failed to send MFA code {code} via SMS")

        except Exception as e:
            self.logger.error(f"Error processing MFA code {code}: {e}")

    def _extract_service_name(self, sender: str, subject: str) -> Optional[str]:
        """
        Extract service name from email sender or subject.

        Args:
            sender: Email sender address
            subject: Email subject line

        Returns:
            Service name or None
        """
        # Common service patterns
        service_patterns = {
            'google': ['google', 'gmail', 'accounts.google'],
            'microsoft': ['microsoft', 'outlook', 'live.com', 'hotmail'],
            'github': ['github', 'noreply@github'],
            'aws': ['aws', 'amazon', 'no-reply@aws'],
            'azure': ['azure', 'microsoft.com'],
            'apple': ['apple', 'icloud', 'appleid'],
            'facebook': ['facebook', 'meta'],
            'twitter': ['twitter', 'x.com'],
            'linkedin': ['linkedin'],
            'discord': ['discord'],
            'slack': ['slack'],
            'dropbox': ['dropbox'],
            'spotify': ['spotify'],
            'netflix': ['netflix'],
            'paypal': ['paypal'],
            'coinbase': ['coinbase'],
            'binance': ['binance'],
        }

        # Check sender domain
        sender_lower = sender.lower()
        subject_lower = subject.lower()

        for service, patterns in service_patterns.items():
            for pattern in patterns:
                if pattern in sender_lower or pattern in subject_lower:
                    return service.title()

        # Extract domain from sender
        if '@' in sender:
            domain = sender.split('@')[1].lower()
            # Remove common email suffixes
            domain = domain.replace('.com', '').replace('.org', '').replace('.net', '')
            if domain and len(domain) > 2:
                return domain.title()

        return None

    async def get_status(self) -> Dict[str, Any]:
        """
        Get current status of the MFA Relay service.

        Returns:
            Dictionary containing service status
        """
        active_monitors = sum(1 for task in self.monitoring_tasks if not task.done())

        return {
            "running": self.running,
            "email_accounts": len(self.email_monitors),
            "active_monitors": active_monitors,
            "check_interval": self.check_interval,
            "total_codes_processed": len(self.last_code_times),
            "uptime": "N/A",  # Would track actual uptime
            "last_check": datetime.now().isoformat()
        }