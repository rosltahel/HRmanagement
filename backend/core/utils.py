from fastapi import BackgroundTasks
import smtplib
from email.message import EmailMessage

def send_reset_email(to_email: str, token: str):
    # Example URL for front-end reset page
    reset_url = f"http://localhost:3000/set-password?token={token}"

    msg = EmailMessage()
    msg['Subject'] = 'Reset your password'
    msg['From'] = 'your@email.com'
    msg['To'] = to_email
    msg.set_content(f"Click the link to reset your password: {reset_url}")

    # Example with SMTP (Gmail)
    with smtplib.SMTP_SSL('smtp.gmail.com', 465) as smtp:
        smtp.login("your@email.com", "your-app-password")
        smtp.send_message(msg)