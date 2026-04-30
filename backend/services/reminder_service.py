from __future__ import annotations
from datetime import datetime, timedelta
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
    ) -> None:
        self._reminder_type = _reminder_type
        self._notify_before_days = _notify_before_days
        self._email_api_key = _email_api_key
        self._sender_email = _sender_email

    def validate_email_config(self) -> bool:
        """Ensure the sender email and API key are valid for sending notifications."""
        return bool(
            self._sender_email and
            "@" in self._sender_email and
            self._email_api_key
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

            with smtplib.SMTP('smtp.ethereal.email', 587) as server:
                server.starttls()
                server.login(self._sender_email, self._email_api_key)
                server.send_message(msg)
                server.quit()

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