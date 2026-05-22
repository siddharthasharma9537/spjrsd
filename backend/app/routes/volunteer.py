from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime, timezone
import uuid

from app.database.db import db
from app.core.dependencies import get_current_admin

router = APIRouter(prefix="/api")

# ==================== VOLUNTEER ROUTES ====================

@router.post("/volunteers")
async def register_volunteer(data: dict):
    existing = await db.volunteers.find_one({"mobile": data.get("mobile")}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Mobile already registered as volunteer")

    vol = {
        "id": str(uuid.uuid4()),
        **data,
        "status": "Pending",
        "created_at": datetime.now(timezone.utc).isoformat()
    }

    await db.volunteers.insert_one(vol)
    return {k: v for k, v in vol.items() if k != "_id"}


@router.get("/admin/volunteers")
async def admin_list_volunteers(user=Depends(get_current_admin)):
    return await db.volunteers.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)
