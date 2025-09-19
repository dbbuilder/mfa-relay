"""
Twilio SMS Client for MFA Relay
Handles SMS sending via Twilio API with rate limiting and error handling.
"""

import logging
import asyncio
from typing import Optional, Dict, Any
from twilio.rest import Client
from twilio.base.exceptions import TwilioRestException


class TwilioClient:
    """Lightweight Twilio SMS client with async support."""

    def __init__(self, account_sid: str, auth_token: str, from_number: str, to_number: str):
        """
        Initialize Twilio client.

        Args:
            account_sid: Twilio Account SID
            auth_token: Twilio Auth Token
            from_number: Twilio phone number (sender)
            to_number: Destination phone number
        """
        self.account_sid = account_sid
        self.auth_token = auth_token
        self.from_number = from_number
        self.to_number = to_number

        self.client: Optional[Client] = None
        self.logger = logging.getLogger(__name__)

        # Initialize client if credentials provided
        if account_sid and auth_token:
            try:
                self.client = Client(account_sid, auth_token)
            except Exception as e:
                self.logger.error(f"Failed to initialize Twilio client: {e}")

    async def test_connection(self) -> bool:
        """
        Test Twilio connection and credentials.

        Returns:
            bool: True if connection successful, False otherwise
        """
        if not self.client:
            self.logger.error("Twilio client not initialized")
            return False

        try:
            # Test by fetching account info
            loop = asyncio.get_event_loop()
            account = await loop.run_in_executor(
                None,
                lambda: self.client.api.accounts(self.account_sid).fetch()
            )

            self.logger.info(f"Twilio connection successful. Account: {account.friendly_name}")
            return True

        except TwilioRestException as e:
            self.logger.error(f"Twilio connection failed: {e}")
            return False
        except Exception as e:
            self.logger.error(f"Unexpected error testing Twilio connection: {e}")
            return False

    async def send_sms(self, message: str, custom_to_number: Optional[str] = None) -> bool:
        """
        Send SMS message.

        Args:
            message: SMS message content
            custom_to_number: Optional custom destination number

        Returns:
            bool: True if SMS sent successfully, False otherwise
        """
        if not self.client:
            self.logger.error("Twilio client not initialized")
            return False

        to_number = custom_to_number or self.to_number

        if not to_number:
            self.logger.error("No destination phone number provided")
            return False

        try:
            # Send SMS in executor to avoid blocking
            loop = asyncio.get_event_loop()
            sms = await loop.run_in_executor(
                None,
                lambda: self.client.messages.create(
                    body=message,
                    from_=self.from_number,
                    to=to_number
                )
            )

            self.logger.info(f"SMS sent successfully. SID: {sms.sid}")
            return True

        except TwilioRestException as e:
            self.logger.error(f"Twilio SMS failed: {e}")
            return False
        except Exception as e:
            self.logger.error(f"Unexpected error sending SMS: {e}")
            return False

    async def send_mfa_code(self, code: str, service_name: Optional[str] = None) -> bool:
        """
        Send MFA code via SMS with formatted message.

        Args:
            code: MFA code to send
            service_name: Optional service name for context

        Returns:
            bool: True if SMS sent successfully, False otherwise
        """
        if service_name:
            message = f"MFA Code for {service_name}: {code}"
        else:
            message = f"MFA Code: {code}"

        return await self.send_sms(message)

    async def get_account_info(self) -> Dict[str, Any]:
        """
        Get Twilio account information.

        Returns:
            Dict containing account info or empty dict on error
        """
        if not self.client:
            return {}

        try:
            loop = asyncio.get_event_loop()
            account = await loop.run_in_executor(
                None,
                lambda: self.client.api.accounts(self.account_sid).fetch()
            )

            return {
                "account_sid": account.sid,
                "friendly_name": account.friendly_name,
                "status": account.status,
                "type": account.type
            }

        except Exception as e:
            self.logger.error(f"Error fetching account info: {e}")
            return {}

    async def get_usage_stats(self) -> Dict[str, Any]:
        """
        Get SMS usage statistics for current month.

        Returns:
            Dict containing usage stats or empty dict on error
        """
        if not self.client:
            return {}

        try:
            from datetime import datetime, date

            # Get current month usage
            loop = asyncio.get_event_loop()
            usage_records = await loop.run_in_executor(
                None,
                lambda: list(self.client.usage.records.list(
                    category='sms',
                    start_date=date.today().replace(day=1),
                    end_date=date.today()
                ))
            )

            total_sent = sum(int(record.count) for record in usage_records)
            total_cost = sum(float(record.price) for record in usage_records)

            return {
                "messages_sent": total_sent,
                "total_cost": total_cost,
                "currency": "USD",
                "period": "current_month"
            }

        except Exception as e:
            self.logger.error(f"Error fetching usage stats: {e}")
            return {}