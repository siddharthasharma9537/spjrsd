import hashlib
import hmac
import logging
import os
import uuid
from datetime import datetime, timezone

import requests
from fastapi import APIRouter, HTTPException, Query, Request

from app.database.db import db

router = APIRouter(prefix="/api")
logger = logging.getLogger(__name__)

WHATSAPP_TOKEN = os.environ.get("WHATSAPP_TOKEN")
WHATSAPP_PHONE_NUMBER_ID = os.environ.get("WHATSAPP_PHONE_NUMBER_ID")
WHATSAPP_VERIFY_TOKEN = os.environ.get("WHATSAPP_VERIFY_TOKEN")
META_APP_SECRET = os.environ.get("META_APP_SECRET")

# All devotee-facing copy lives here, bilingual (English + Telugu), so it can
# be edited without touching the webhook/routing logic below. Add a new menu
# item by adding a key to REPLIES and a matching line + keywords to MENU_KEYWORDS.
SITE = "https://cheruvugattu.online"

MENU_TEXT = (
    "🙏 Namaste! Welcome to Sri Parvathi Jadala Ramalingeshwara Swamy "
    "Devastanam.\n\n"
    "నమస్తే! శ్రీ పార్వతీ జడల రామలింగేశ్వర స్వామి దేవస్థానానికి స్వాగతం.\n\n"
    "Reply with a number:\n"
    "1️⃣ Temple Timings / ఆలయ సమయాలు\n"
    "2️⃣ Sevas & Booking / సేవలు & బుకింగ్\n"
    "3️⃣ Donations / విరాళాలు\n"
    "4️⃣ Accommodation / వసతి\n"
    "5️⃣ Address & Directions / చిరునామా\n"
    "6️⃣ Talk to the temple office / కార్యాలయాన్ని సంప్రదించండి"
)

REPLIES = {
    "1": (
        "🕉️ Temple Timings / ఆలయ సమయాలు\n\n"
        "Morning: 5:00 AM – 1:00 PM\n"
        "Evening: 3:00 PM – 7:00 PM\n\n"
        "ఉదయం: 5:00 - 1:00\n"
        "సాయంత్రం: 3:00 - 7:00"
    ),
    "2": (
        "🪔 Sevas & Booking / సేవలు & బుకింగ్\n\n"
        "Some popular sevas:\n"
        "- Kumkumarchana / కుంకుమార్చన – ₹30\n"
        "- Abhishekam / అభిషేకం – ₹200\n"
        "- Sri Satyanarayana Swamy Vratam / శ్రీ సత్యనారాయణ స్వామి వ్రతం – ₹300\n"
        "- Swamy Vari Kalyanam / శ్రీ స్వామివారి కళ్యాణం – ₹1000\n\n"
        f"See the full list and book online: {SITE}/sevas"
    ),
    "3": (
        "🙏 Donations / విరాళాలు\n\n"
        "You can contribute towards e-Hundi, Annadanam, and other temple "
        "sevas online:\n"
        f"{SITE}/donations"
    ),
    "4": (
        "🛏️ Accommodation / వసతి\n\n"
        "- Siva Nilayam (AC Room) – ₹800/day\n"
        "- Parvathi Sadanam (Non-AC Room) – ₹400/day\n"
        "- Nandi Cottage – ₹1500/day\n"
        "- Pilgrim Dormitory – ₹100/day\n\n"
        f"Check availability and book: {SITE}/accommodation"
    ),
    "5": (
        "📍 Address & Directions / చిరునామా\n\n"
        "Sri Parvathi Jadala Ramalingeshwara Swamy Devasthanams, "
        "Cheruvugattu, Narketpally Mandal, Nalgonda District, "
        "Telangana - 508254, India\n\n"
        "శ్రీ పార్వతీ జడల రామలింగేశ్వర స్వామి దేవస్థానం, చెరువుగట్టు, "
        "నార్కట్‌పల్లి మండలం, నల్గొండ జిల్లా, తెలంగాణ - 508254"
    ),
    "6": (
        "☎️ Temple Office / కార్యాలయం\n\n"
        "Sri S. Mohan Babu, Executive Officer\n"
        "Phone: +91 94910 00701\n"
        "Email: admin@cheruvugattu.online\n\n"
        f"Or write to us here: {SITE}/support/contact"
    ),
}

# Lets devotees type a keyword instead of memorizing the menu number. Checked
# as a substring against the lowercased message, in this order, before
# falling back to an exact match on the menu number itself.
MENU_KEYWORDS = {
    "timing": "1",
    "hour": "1",
    "seva": "2",
    "book": "2",
    "donat": "3",
    "hundi": "3",
    "annadanam": "3",
    "accommodation": "4",
    "room": "4",
    "stay": "4",
    "address": "5",
    "location": "5",
    "direction": "5",
    "contact": "6",
    "office": "6",
    "phone": "6",
}


def _reply_for(text_body: str | None) -> str:
    if text_body:
        stripped = text_body.strip()
        if stripped in REPLIES:
            return REPLIES[stripped]
        lowered = stripped.lower()
        for keyword, option in MENU_KEYWORDS.items():
            if keyword in lowered:
                return REPLIES[option]
    return MENU_TEXT


def _send_whatsapp_text(to: str, body: str):
    if not WHATSAPP_TOKEN or not WHATSAPP_PHONE_NUMBER_ID:
        logger.warning("Skipping WhatsApp reply to %s: WHATSAPP_TOKEN/WHATSAPP_PHONE_NUMBER_ID not configured", to)
        return
    resp = requests.post(
        f"https://graph.facebook.com/v18.0/{WHATSAPP_PHONE_NUMBER_ID}/messages",
        headers={"Authorization": f"Bearer {WHATSAPP_TOKEN}", "Content-Type": "application/json"},
        json={
            "messaging_product": "whatsapp",
            "to": to,
            "type": "text",
            "text": {"body": body},
        },
        timeout=15,
    )
    if resp.status_code >= 300:
        logger.error("WhatsApp send to %s failed (%s): %s", to, resp.status_code, resp.text)


def _verify_signature(raw_body: bytes, signature_header: str | None) -> bool:
    """Checks the X-Hub-Signature-256 header Meta signs each webhook delivery
    with, so forged requests can't make this endpoint send messages on the
    temple's behalf. Skipped (with a warning) if META_APP_SECRET isn't set."""
    if not META_APP_SECRET:
        return True
    if not signature_header or not signature_header.startswith("sha256="):
        return False
    expected = hmac.new(META_APP_SECRET.encode(), raw_body, hashlib.sha256).hexdigest()
    return hmac.compare_digest(expected, signature_header.removeprefix("sha256="))


@router.get("/whatsapp/webhook")
async def verify_whatsapp_webhook(
    hub_mode: str | None = Query(None, alias="hub.mode"),
    hub_verify_token: str | None = Query(None, alias="hub.verify_token"),
    hub_challenge: str | None = Query(None, alias="hub.challenge"),
):
    if not WHATSAPP_VERIFY_TOKEN:
        raise HTTPException(status_code=500, detail="WHATSAPP_VERIFY_TOKEN is not configured")
    if hub_mode == "subscribe" and hub_verify_token == WHATSAPP_VERIFY_TOKEN:
        return int(hub_challenge)
    raise HTTPException(status_code=403, detail="Verification failed")


@router.post("/whatsapp/webhook")
async def receive_whatsapp_webhook(request: Request):
    raw_body = await request.body()
    if not _verify_signature(raw_body, request.headers.get("x-hub-signature-256")):
        raise HTTPException(status_code=403, detail="Invalid signature")

    payload = await request.json()

    for entry in payload.get("entry", []):
        for change in entry.get("changes", []):
            value = change.get("value", {})
            for message in value.get("messages", []):
                await _handle_inbound_message(message, value)

    # Meta only cares that this returns 200; delivery-status callbacks
    # ("sent"/"delivered"/"read") land in the same payload shape under
    # value.statuses and are intentionally ignored for now.
    return {"status": "ok"}


async def _handle_inbound_message(message: dict, value: dict):
    from_number = message.get("from")
    message_type = message.get("type")
    text_body = message.get("text", {}).get("body") if message_type == "text" else None

    contacts = value.get("contacts", [])
    profile_name = contacts[0]["profile"]["name"] if contacts else None

    await db.whatsapp_messages.insert_one({
        "id": str(uuid.uuid4()),
        "from": from_number,
        "profile_name": profile_name,
        "type": message_type,
        "text": text_body,
        "wa_message_id": message.get("id"),
        "created_at": datetime.now(timezone.utc).isoformat(),
    })

    if from_number:
        _send_whatsapp_text(from_number, _reply_for(text_body))
