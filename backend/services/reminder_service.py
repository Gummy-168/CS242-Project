from __future__ import annotations
from datetime import datetime, timedelta
import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

from models.assignment import Assignment

class ReminderService:
    def __init__(
        self,
        _reminder_type: str,
        _notify_before_days: int,
        _email_api_key: str,
        _sender_email: str,
        _smtp_host: str = "smtp.ethereal.email",
        _smtp_port: int = 587,
        _smtp_username: str | None = None,
        _smtp_use_tls: bool = True,
    ) -> None:
        self._reminder_type = _reminder_type
        self._notify_before_days = _notify_before_days
        self._email_api_key = _email_api_key
        self._sender_email = _sender_email
        self._smtp_host = _smtp_host
        self._smtp_port = _smtp_port
        self._smtp_username = _smtp_username
        self._smtp_use_tls = _smtp_use_tls

    @classmethod
    def from_env(cls, reminder_type: str = "EMAIL", notify_before_days: int = 1) -> "ReminderService":
        smtp_port_raw = os.getenv("SMTP_PORT", "587").strip()
        try:
            smtp_port = int(smtp_port_raw)
        except ValueError:
            smtp_port = 587

        smtp_username = os.getenv("SMTP_USERNAME", "").strip() or None
        sender_email = os.getenv("SMTP_SENDER_EMAIL", "").strip() or smtp_username or ""
        return cls(
            _reminder_type=reminder_type,
            _notify_before_days=notify_before_days,
            _email_api_key=os.getenv("SMTP_PASSWORD", "").strip(),
            _sender_email=sender_email,
            _smtp_host=os.getenv("SMTP_HOST", "").strip(),
            _smtp_port=smtp_port,
            _smtp_username=smtp_username,
            _smtp_use_tls=os.getenv("SMTP_USE_TLS", "true").strip().lower() in {"1", "true", "yes", "on"},
        )

    def validate_email_config(self) -> bool:
        """Ensure the sender email and API key are valid for sending notifications."""
        return bool(
            self._smtp_host and
            self._smtp_port > 0 and
            self._sender_email and
            "@" in self._sender_email
        )

    def schedule_notification(self, assignment: Assignment) -> datetime:
        """Calculate the notification time based on the assignment's due date and the configured reminder settings."""
        return assignment.deadline - timedelta(days=self._notify_before_days)

    def validate_reminder_settings(self) -> bool:
        """Validate that the notification interval and type are correctly configured."""
        valid_types = ["EMAIL", "CALENDAR", "BOTH"]
        return self._notify_before_days >= 0 and self._reminder_type in valid_types
    
    def send_email_notification(self, recipient_email: str, subject: str, body: str) -> bool:
        """Send an email notification using the configured email API key and sender email."""
        if not self.validate_email_config():
            print("Invalid email configuration. Cannot send email notification.")
            return False  # Invalid email configuration
        
        try:
            msg = MIMEMultipart()
            msg['From'] = self._sender_email
            msg['To'] = recipient_email
            msg['Subject'] = subject
            msg.attach(MIMEText(body, 'plain'))

            with smtplib.SMTP(self._smtp_host, self._smtp_port, timeout=20) as server:
                if self._smtp_use_tls:
                    server.starttls()
                if self._email_api_key:
                    server.login(self._smtp_username or self._sender_email, self._email_api_key)
                server.send_message(msg)

            print(f"Email sent successfully to {recipient_email}")
            return True
        
        except Exception as e:
            print(f"Failed to send email notification: {e}")
            return False

    def send_reminder(self, assignment: Assignment, recipient_email: str) -> bool:
        """Main method to trigger the reminder notification based on the assignment details."""
        if assignment.status.value in ["COMPLETED", "OVERDUE"]:
            return False  # No reminder needed for completed or overdue assignments
        
        days_left = assignment.days_remaining()

        subject = f"Reminder: {assignment.title} is due in {days_left} days"
        body = (
            f"Hello,\n\nThis is a reminder that the assignment '{assignment.title}' "
            f"is due on {assignment.deadline.strftime('%Y-%m-%d')}. You have {days_left} days left to complete it.\n\n"
            "Please make sure to submit it on time.\n\nBest regards,\nYour Assignment Tracker"
        )

        success = True
        if self._reminder_type in ["EMAIL", "BOTH"]:
            success = self.send_email_notification(recipient_email, subject, body)

        if self._reminder_type in ["CALENDAR", "BOTH"]:
            self.sync_to_calendar([assignment])

        return success
    
    def sync_to_calendar(self, assignments: list[Assignment]) -> dict[str, list[datetime]]:
        ... # Placeholder for calendar synchronization logic
