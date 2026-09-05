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

# Devotee-facing auto-reply sent for any inbound message. Kept as a single
# constant so it's easy to find and edit without touching the webhook logic.
AUTO_REPLY_TEXT = (
    "Namaste! Thank you for messaging Sri Parvathi Jadala Ramalingeshwara "
    "Swamy Devastanam. We've received your message and our team will get "
    "back to you shortly."
)


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
        _send_whatsapp_text(from_number, AUTO_REPLY_TEXT)
