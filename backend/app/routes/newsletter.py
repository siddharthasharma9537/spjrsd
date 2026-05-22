from fastapi import APIRouter, HTTPException
from datetime import datetime, timezone
import uuid

from app.database.db import db
from app.schemas.newsletter import NewsletterSubscribe

router = APIRouter(prefix="/api")

# ==================== NEWSLETTER ROUTES ====================

@router.post("/newsletter/subscribe")
async def subscribe_newsletter(data: NewsletterSubscribe):

    email = data.email
    if not email:
        raise HTTPException(status_code=400, detail="Email is required")

    existing = await db.newsletter.find_one({"email": email})
    if existing:
        return {"message": "Already subscribed"}

    entry = {
        "id": str(uuid.uuid4()),
        "email": email,
        "created_at": datetime.now(timezone.utc).isoformat()
    }

    await db.newsletter.insert_one(entry)
    return {"message": "Subscribed successfully"}
