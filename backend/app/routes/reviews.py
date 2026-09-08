import os
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Request

from app.core.dependencies import get_current_admin
from app.database.db import db
from app.services import review_agent

router = APIRouter(prefix="/api")

# Same shared secret main.py checks for POST /api/cron/panchangam-digest.
CRON_SECRET = os.environ.get("CRON_SECRET")

# ==================== REVIEW REPLY AGENT ====================


@router.post("/cron/review-agent")
async def cron_review_agent(request: Request):
    if not CRON_SECRET or request.headers.get("X-Cron-Secret") != CRON_SECRET:
        raise HTTPException(status_code=403, detail="Forbidden")
    return await review_agent.process_new_reviews()


@router.get("/admin/reviews")
async def admin_list_reviews(status: str = None, user=Depends(get_current_admin)):
    query = {"status": status} if status else {}
    return await db.review_replies.find(query, {"_id": 0}).sort("created_at", -1).to_list(500)


@router.put("/admin/reviews/{review_id}")
async def admin_edit_review_reply(review_id: str, data: dict, user=Depends(get_current_admin)):
    draft_reply = (data.get("draft_reply") or "").strip()
    if not draft_reply:
        raise HTTPException(status_code=400, detail="draft_reply is required")

    result = await db.review_replies.update_one(
        {"id": review_id, "status": "pending_approval"},
        {"$set": {"draft_reply": draft_reply}},
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Review not found or not pending approval")
    return await db.review_replies.find_one({"id": review_id}, {"_id": 0})


@router.post("/admin/reviews/{review_id}/approve")
async def admin_approve_review_reply(review_id: str, user=Depends(get_current_admin)):
    record = await db.review_replies.find_one({"id": review_id}, {"_id": 0})
    if not record:
        raise HTTPException(status_code=404, detail="Review not found")
    if record["status"] != "pending_approval":
        raise HTTPException(status_code=400, detail=f"Review is already {record['status']}")

    review_agent.post_reply(record["gbp_review_name"], record["draft_reply"])

    await db.review_replies.update_one(
        {"id": review_id},
        {"$set": {
            "status": "approved",
            "posted_reply": record["draft_reply"],
            "decided_at": datetime.now(timezone.utc).isoformat(),
        }},
    )
    return await db.review_replies.find_one({"id": review_id}, {"_id": 0})


@router.post("/admin/reviews/{review_id}/reject")
async def admin_reject_review_reply(review_id: str, user=Depends(get_current_admin)):
    result = await db.review_replies.update_one(
        {"id": review_id, "status": "pending_approval"},
        {"$set": {"status": "rejected", "decided_at": datetime.now(timezone.utc).isoformat()}},
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Review not found or not pending approval")
    return await db.review_replies.find_one({"id": review_id}, {"_id": 0})
