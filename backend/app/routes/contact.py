import logging
import os
from fastapi import APIRouter, Depends
from datetime import datetime, timezone
import uuid
import requests

from app.database.db import db
from app.core.dependencies import get_current_admin
from app.schemas.contact import ContactMessageCreate

router = APIRouter(prefix="/api")
logger = logging.getLogger(__name__)

ADMIN_ALERT_EMAIL = "admin@cheruvugattu.online"

# Matched against the contact form's subject+message (case-insensitive) to
# auto-reply directly to the visitor instead of waiting for the admin to
# answer manually - same wording the admin has been typing by hand. Spelling
# varies a lot in practice ("kalayan kattu", "kalyan katta", ...), so rather
# than enumerate every variant, "kaly"/"kalay" + "katt" together is treated
# as a match alongside the other, unambiguous keywords below.
KALYANA_KATTA_KEYWORDS = (
    "thalanelalu", "tala neelalu", "talaneelalu", "tonsure",
    "కళ్యాణ కట్ట", "తలనీలాలు",
)
KALYANA_KATTA_REPLY = (
    "06:00am - 12:00pm\n"
    "03:00pm - 06:00pm\n\n"
    "All days. Timings may vary +/- 30 minutes on certain days due to high / low public reach.\n\n"
    "Thank you,\n"
    "Om Namo Bhagavate Ramalingaya \U0001F64F"
)

# ==================== CONTACT ROUTES ====================

def _send_msg91_email(to_email: str, subject: str, message: str) -> bool:
    """Best-effort email send via MSG91; returns False (after logging) on any
    failure so callers can treat it as non-blocking."""
    auth_key = os.environ.get("MSG91_AUTH_KEY")
    domain = os.environ.get("MSG91_EMAIL_DOMAIN")
    from_email = os.environ.get("MSG91_EMAIL_FROM")
    template_slug = os.environ.get("MSG91_EMAIL_TEMPLATE_SLUG", "spjrsd_generic_transactional")
    if not auth_key or not domain or not from_email:
        logger.warning("Skipping email to %s: MSG91 email is not configured", to_email)
        return False
    try:
        resp = requests.post(
            "https://control.msg91.com/api/v5/email/send",
            headers={"authkey": auth_key, "Content-Type": "application/json"},
            json={
                "recipients": [{"to": [{"email": to_email}], "variables": {"subject": subject, "message": message}}],
                "from": {"email": from_email, "name": "Sri Parvathi Jadala Ramalingeshwara Swamy Devasthanam"},
                "domain": domain,
                "template_id": template_slug,
            },
            timeout=15,
        )
        if resp.status_code >= 300:
            logger.error("MSG91 email to %s failed (%s): %s", to_email, resp.status_code, resp.text)
            return False
        return True
    except requests.RequestException as e:
        logger.error("MSG91 email to %s request failed: %s", to_email, e)
        return False


def _notify_admin_of_contact_message(data: ContactMessageCreate):
    subject = f"New contact form message: {data.subject or 'General Inquiry'}"
    message = f"From: {data.name} <{data.email}>\n\n{data.message}"
    _send_msg91_email(ADMIN_ALERT_EMAIL, subject, message)


def _mentions_kalyana_katta(text: str) -> bool:
    lowered = text.lower()
    if any(keyword in lowered for keyword in KALYANA_KATTA_KEYWORDS):
        return True
    return ("kaly" in lowered or "kalay" in lowered) and "katt" in lowered


def _maybe_auto_reply_kalyana_katta(data: ContactMessageCreate):
    if _mentions_kalyana_katta(f"{data.subject or ''} {data.message}"):
        subject = f"Re: {data.subject or 'Kalyana Katta (Thalanelalu) Timings'}"
        _send_msg91_email(data.email, subject, KALYANA_KATTA_REPLY)


@router.post("/contact")
async def submit_contact(data: ContactMessageCreate):
    msg = {
        "id": str(uuid.uuid4()),
        **data.model_dump(),
        "status": "New",
        "created_at": datetime.now(timezone.utc).isoformat()
    }

    await db.contact_messages.insert_one(msg)
    _notify_admin_of_contact_message(data)
    _maybe_auto_reply_kalyana_katta(data)
    return {"message": "Contact message submitted successfully"}


@router.get("/admin/contact-messages")
async def admin_contact_messages(user=Depends(get_current_admin)):
    messages = await db.contact_messages.find({}, {"_id": 0}).sort("created_at", -1).to_list(200)

    # Contact messages have no login requirement, so there's no real devotee_id
    # foreign key - match against registered devotees by mobile/email instead,
    # same heuristic used by GET /admin/devotees/{id}/activity.
    devotees = await db.devotees.find({}, {"_id": 0, "id": 1, "name": 1, "mobile": 1, "email": 1}).to_list(5000)
    by_mobile = {d["mobile"]: d for d in devotees if d.get("mobile")}
    by_email = {d["email"]: d for d in devotees if d.get("email")}
    for m in messages:
        match = by_mobile.get(m.get("mobile")) or by_email.get(m.get("email"))
        if match:
            m["devotee_id"] = match["id"]
            m["devotee_name"] = match["name"]

    return messages
