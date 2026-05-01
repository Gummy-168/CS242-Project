from services.reminder_service import ReminderService

#USE THIS FOR TESTING {https://ethereal.email/}, PRESS CREATE ACCOUNT.

SENDER_EMAIL = "ETHEREAL EMAIL HERE" 
EMAIL_PASSWORD = "ETHEREAL PASSWORD HERE"

def run_ethereal_test():
    print("Setting up Ethereal email test...")
    
    service = ReminderService(
        _reminder_type="EMAIL",
        _notify_before_days=1,
        _email_api_key=EMAIL_PASSWORD,
        _sender_email=SENDER_EMAIL
    )
    
    print("Attempting to send Ethereal email...")
    success = service.send_email_notification(
        recipient_email="reptest@example.com",
        subject="CS242 Ethereal Test!",
        body="If you see this in the Ethereal inbox, your Python code works!"
    )

    if success:
        print("✅ Sent! Go back to the Ethereal website and click the 'Messages' tab to see it.")

if __name__ == "__main__":
    run_ethereal_test()