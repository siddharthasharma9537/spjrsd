from fastapi import APIRouter, Depends
from datetime import datetime, timezone
import uuid

from app.database.db import db
from app.core.dependencies import get_current_admin
from app.schemas.contact import ContactMessageCreate

router = APIRouter(prefix="/api")

# ==================== CONTACT ROUTES ====================

@router.post("/contact")
async def submit_contact(data: ContactMessageCreate):
    msg = {
        "id": str(uuid.uuid4()),
        **data.model_dump(),
        "status": "New",
        "created_at": datetime.now(timezone.utc).isoformat()
    }

    await db.contact_messages.insert_one(msg)
    return {"message": "Contact message submitted successfully"}


@router.get("/admin/contact-messages")
async def admin_contact_messages(user=Depends(get_current_admin)):
    return await db.contact_messages.find({}, {"_id": 0}).sort("created_at", -1).to_list(200)
