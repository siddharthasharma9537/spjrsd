from fastapi import APIRouter
from datetime import datetime, timezone

from app.main import db

router = APIRouter(prefix="/api")

# ==================== VISITOR STATS ROUTES ====================

@router.get("/visitor-stats")
async def get_visitor_stats():
    stats = await db.visitor_stats.find_one({"key": "main"}, {"_id": 0})
    if not stats:
        stats = {
            "total_visitors": 12847,
            "todays_visitors": 0,
            "last_reset_date": datetime.now(timezone.utc).strftime("%Y-%m-%d")
        }

    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")

    if stats.get("last_reset_date") != today:
        await db.visitor_stats.update_one(
            {"key": "main"},
            {"$set": {"todays_visitors": 0, "last_reset_date": today}},
            upsert=True
        )
        stats["todays_visitors"] = 0

    return stats


@router.post("/visitor-stats/track")
async def track_visitor():
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    result = await db.visitor_stats.find_one({"key": "main"})

    if not result:
        await db.visitor_stats.insert_one({
            "key": "main",
            "total_visitors": 12848,
            "todays_visitors": 1,
            "last_reset_date": today
        })
    else:
        update = {"$inc": {"total_visitors": 1, "todays_visitors": 1}}

        if result.get("last_reset_date") != today:
            update = {
                "$inc": {"total_visitors": 1},
                "$set": {"todays_visitors": 1, "last_reset_date": today}
            }

        await db.visitor_stats.update_one({"key": "main"}, update)

    return {"message": "tracked"}
