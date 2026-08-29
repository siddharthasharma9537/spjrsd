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

# ==================== CONTACT ROUTES ====================

def _notify_admin_of_contact_message(data: ContactMessageCreate):
    """Best-effort admin alert via MSG91; a failure here must not block the
    submission, since the message is already saved to contact_messages."""
    auth_key = os.environ.get("MSG91_AUTH_KEY")
    domain = os.environ.get("MSG91_EMAIL_DOMAIN")
    from_email = os.environ.get("MSG91_EMAIL_FROM")
    template_slug = os.environ.get("MSG91_EMAIL_TEMPLATE_SLUG", "spjrsd_generic_transactional")
    if not auth_key or not domain or not from_email:
        logger.warning("Skipping contact form admin alert email: MSG91 email is not configured")
        return
    subject = f"New contact form message: {data.subject or 'General Inquiry'}"
    message = f"From: {data.name} <{data.email}>\n\n{data.message}"
    try:
        resp = requests.post(
            "https://control.msg91.com/api/v5/email/send",
            headers={"authkey": auth_key, "Content-Type": "application/json"},
            json={
                "recipients": [{"to": [{"email": ADMIN_ALERT_EMAIL}], "variables": {"subject": subject, "message": message}}],
                "from": {"email": from_email, "name": "Sri Parvathi Jadala Ramalingeshwara Swamy Devasthanam"},
                "domain": domain,
                "template_id": template_slug,
            },
            timeout=15,
        )
        if resp.status_code >= 300:
            logger.error("MSG91 contact form alert failed (%s): %s", resp.status_code, resp.text)
    except requests.RequestException as e:
        logger.error("MSG91 contact form alert request failed: %s", e)


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
