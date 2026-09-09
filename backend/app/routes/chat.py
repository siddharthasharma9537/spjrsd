"""Web chat widget endpoint - the same "brain" (chat_agent) and intent
classifier (intent_router) as the WhatsApp free-text flow in
routes/whatsapp.py, so a devotee gets a consistent answer whichever channel
they use.

Unlike WhatsApp, there's no phone number to key a session on - an anonymous
website visitor has no stable identity. So conversation history is NOT kept
server-side here: the widget sends back the history it already has (its own
in-memory/localStorage state) with every request, and this endpoint is
otherwise stateless. That's exactly the contract chat_agent.ask() and
intent_router.classify() already expect - the caller owns history.
"""

import logging
import time
from collections import defaultdict

from fastapi import APIRouter, HTTPException, Request

from app.schemas.chat import ChatRequest, ChatResponse
from app.services import chat_agent, intent_router
from app.services.chat_agent import SITE

router = APIRouter(prefix="/api")
logger = logging.getLogger(__name__)

# A public, unauthenticated endpoint that calls a paid LLM API on every
# request has no natural cost ceiling the way WhatsApp does (tied to a real
# phone number, and Meta's own messaging costs/limits). This is a minimal
# per-IP throttle, not real rate-limiting infrastructure: in-memory, resets
# on restart, and doesn't share state across multiple server instances.
# Good enough for a single Render instance; revisit (e.g. Redis) if that
# changes.
RATE_LIMIT_WINDOW_SECONDS = 60
RATE_LIMIT_MAX_REQUESTS = 10
_request_log: dict[str, list[float]] = defaultdict(list)

# Applied regardless of what the widget sends, same reasoning as
# whatsapp.py's CHAT_HISTORY_TURNS - caps the cost/latency of any one
# request no matter how long a conversation has run.
MAX_HISTORY_TURNS = 20


def _rate_limited(ip: str) -> bool:
    now = time.monotonic()
    recent = [t for t in _request_log[ip] if now - t < RATE_LIMIT_WINDOW_SECONDS]
    recent.append(now)
    _request_log[ip] = recent
    return len(recent) > RATE_LIMIT_MAX_REQUESTS


@router.post("/chat", response_model=ChatResponse)
async def chat(payload: ChatRequest, request: Request):
    client_ip = request.client.host if request.client else "unknown"
    if _rate_limited(client_ip):
        raise HTTPException(status_code=429, detail="Too many messages - please wait a moment and try again.")

    history = [turn.model_dump() for turn in (payload.history or [])][-MAX_HISTORY_TURNS:]

    if await intent_router.classify(payload.message, history) == "transact":
        return ChatResponse(
            reply=(
                "I can't book a seva, take a donation, or reserve accommodation here - "
                f"please use {SITE}/sevas, {SITE}/donations, or {SITE}/accommodation to do that directly."
            )
        )

    reply = await chat_agent.ask(payload.message, history)
    return ChatResponse(reply=reply)
