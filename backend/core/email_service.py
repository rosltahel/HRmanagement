import os
from email.message import EmailMessage
import aiosmtplib
from dotenv import load_dotenv

load_dotenv()

EMAIL_USER = os.getenv("EMAIL_USER")
EMAIL_PASSWORD = os.getenv("EMAIL_PASSWORD")


async def send_reset_email(to_email: str, reset_link: str):
    message = EmailMessage()
    message["From"] = EMAIL_USER
    message["To"] = to_email
    message["Subject"] = "Reset Your Password"
    message.set_content(f"Click the link to reset your password: {reset_link}")

    await aiosmtplib.send(
        message,
        hostname="smtp.gmail.com",
        port=587,
        start_tls=True,
        username=EMAIL_USER,
        password=EMAIL_PASSWORD,
    )