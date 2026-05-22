from fastapi import APIRouter

from app.main import db

router = APIRouter(prefix="/api")

# ==================== LIVE STREAM ROUTES ====================

@router.get("/live-streams")
async def get_live_streams():
    return await db.live_streams.find({}, {"_id": 0}).to_list(10)
