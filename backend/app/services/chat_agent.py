"""Conversational AI agent for devotee-facing Q&A - FAQs, seva timings and
prices, panchangam/festival dates, stotrams, and general spiritual questions.

This module only ever reads from the database and returns text. It must
never be the thing that creates a booking, an accommodation reservation, or a
donation - those stay on the deterministic menu/button flows in main.py and
whatsapp.py. The caller (routes/chat.py, routes/whatsapp.py) is responsible
for deciding whether a message should reach this module at all versus being
routed to those flows; see the module docstring there for that rule.

Answers are grounded in a snapshot of live Mongo content assembled fresh on
every call (see _fetch_context) rather than a fixed/cached prompt, so a
change an admin makes in the dashboard (a new seva price, a new panchangam
entry) is reflected on the very next question - there is no reindexing step.

Sthala Puranam (the temple's history) is NOT included below: it currently
only exists as hardcoded JSX in frontend/src/pages/AboutTemple.jsx, not in
MongoDB, and getting temple history/theology wrong is a real trust problem -
so it's deliberately left out rather than guessed at secondhand from the
page's markup. Move it into a database collection (e.g. a singleton
`site_content` doc) before including it here.
"""

import logging
import os
from datetime import datetime, timezone

from google import genai
from google.genai import types
from google.genai.errors import APIError

from app.database.db import db

logger = logging.getLogger(__name__)

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")
CHAT_AGENT_MODEL = os.environ.get("CHAT_AGENT_MODEL", "gemini-3.6-flash")
MAX_TOKENS = 1024

_client = genai.Client(api_key=GEMINI_API_KEY) if GEMINI_API_KEY else None

SITE = "https://cheruvugattu.online"

SYSTEM_PROMPT = f"""You are the devotee-facing assistant for Sri Parvathi Jadala
Ramalingeshwara Swamy Devastanam, a Hindu temple in Cheruvugattu (Narketpally
mandal, Nalgonda district, Telangana). Devotees reach you through the
temple's website chat widget or WhatsApp.

You answer questions about seva timings and prices, panchangam (today's
tithi/nakshatra/rahu kalam etc.), upcoming festivals, stotrams, temple news,
and general spiritual questions. Reply in the same language the devotee
writes in (English or Telugu); if unsure, default to English.

Ground every factual answer - especially prices, timings, and dates - only in
the CONTEXT block below. If something isn't in it, say plainly that you don't
have that information and suggest the devotee call the temple office or check
{SITE}, rather than guessing or estimating.

You must NEVER say a seva has been booked, a donation has been made, or an
accommodation has been reserved - you have no ability to do any of these.
If a devotee asks to book a seva, make a donation, or reserve accommodation,
tell them to use the menu options (WhatsApp) or the booking pages on the
website ({SITE}/sevas, {SITE}/donations, {SITE}/accommodation) instead of
attempting it here.

Keep answers short and conversational - this is a chat, not an essay."""


async def _fetch_context() -> str:
    """Assemble a compact text snapshot of the live content to ground on."""
    today = datetime.now(timezone.utc).date().isoformat()

    sevas = await db.sevas.find(
        {"active_flag": True},
        {"_id": 0, "name_english": 1, "name_telugu": 1, "base_price": 1,
         "duration_minutes": 1, "is_online_bookable": 1, "special_instructions": 1,
         "location_categories": 1},
    ).to_list(200)

    stotrams = await db.stotrams.find(
        {"active_flag": True},
        {"_id": 0, "title": 1, "title_telugu": 1, "deity": 1, "slug": 1},
    ).sort("display_order", 1).to_list(200)

    panchangam_today = await db.panchangam.find_one({"date": today}, {"_id": 0})

    upcoming_special_days = await db.panchangam.find(
        {"date": {"$gte": today}, "special_note": {"$nin": [None, ""]}},
        {"_id": 0, "date": 1, "special_note": 1, "special_note_telugu": 1},
    ).sort("date", 1).to_list(10)

    recent_news = await db.news.find(
        {"active_flag": True},
        {"_id": 0, "title": 1, "content": 1, "is_important": 1},
    ).sort("posted_at", -1).to_list(5)

    lines = [f"Today's date: {today}", ""]

    def _format_seva(s: dict) -> str:
        bookable = "online bookable" if s.get("is_online_bookable") else "counter only"
        return (
            f"- {s.get('name_english')} ({s.get('name_telugu')}): "
            f"Rs. {s.get('base_price')}, {s.get('duration_minutes')} min, {bookable}"
            + (f" - {s['special_instructions']}" if s.get("special_instructions") else "")
        )

    # Sevas are grouped by which shrine they're performed at (a seva can belong
    # to both, e.g. Ashtottaram/Gotra Namarchana), so seva ticket prices are
    # presented the way the temple office itself categorizes them rather than
    # as one flat list. Anything with no location_categories set falls under
    # "Other Sevas".
    gattupaina = [s for s in sevas if "gattupaina" in (s.get("location_categories") or [])]
    ammavari = [s for s in sevas if "ammavari" in (s.get("location_categories") or [])]
    other = [s for s in sevas if not s.get("location_categories")]

    lines.append("SEVAS AND TICKET PRICES, grouped by shrine:")
    lines.append("")
    lines.append("Gattupaina Aarjitha Seva Tickets:")
    for s in gattupaina:
        lines.append(_format_seva(s))
    lines.append("")
    lines.append("Sri Ammavari Devalayamlo Aarjitha Seva Tickets:")
    for s in ammavari:
        lines.append(_format_seva(s))
    lines.append("")
    lines.append("Other Sevas:")
    for s in other:
        lines.append(_format_seva(s))

    lines.append("")
    lines.append("STOTRAMS available (title - deity):")
    for st in stotrams:
        lines.append(f"- {st.get('title')} ({st.get('title_telugu')}) - {st.get('deity')}")

    lines.append("")
    if panchangam_today:
        lines.append("TODAY'S PANCHANGAM:")
        for key in ("vaaram", "masa", "paksha", "tithi", "nakshatra", "yoga", "karana",
                    "sunrise", "sunset", "rahu_kalam", "yamagandam", "gulika_kalam"):
            value = panchangam_today.get(key)
            if value:
                lines.append(f"- {key}: {value}")
        if panchangam_today.get("special_note"):
            lines.append(f"- special note: {panchangam_today['special_note']}")
    else:
        lines.append("TODAY'S PANCHANGAM: not entered in the system yet.")

    lines.append("")
    lines.append("UPCOMING FESTIVALS / SPECIAL DAYS:")
    for day in upcoming_special_days:
        lines.append(f"- {day['date']}: {day.get('special_note')} ({day.get('special_note_telugu', '')})")

    lines.append("")
    lines.append("RECENT TEMPLE NEWS:")
    for item in recent_news:
        flag = " [IMPORTANT]" if item.get("is_important") else ""
        lines.append(f"- {item.get('title')}{flag}: {item.get('content')}")

    return "\n".join(lines)


async def ask(message: str, history: list[dict] | None = None) -> str:
    """Answer one devotee message, grounded in live temple data.

    `history` is prior turns as [{"role": "user"|"assistant", "content": str}],
    oldest first - the caller owns persisting/trimming it (WhatsApp sessions
    vs. a web widget's in-memory state differ enough that this module
    shouldn't assume either). Pass None or [] for a fresh conversation.
    """
    if _client is None:
        logger.warning("chat_agent.ask called without GEMINI_API_KEY configured")
        return (
            "I'm not able to chat right now - please use the menu options, "
            f"or reach the temple office directly via {SITE}/contact."
        )

    context = await _fetch_context()
    # Gemini's roles are "user"/"model", not Anthropic's "user"/"assistant",
    # and each turn's text goes in a "parts" list rather than a bare string.
    contents = [
        types.Content(role="model" if turn["role"] == "assistant" else "user",
                      parts=[types.Part(text=turn["content"])])
        for turn in (history or [])
    ]
    contents.append(types.Content(role="user", parts=[types.Part(text=message)]))

    try:
        response = await _client.aio.models.generate_content(
            model=CHAT_AGENT_MODEL,
            contents=contents,
            config=types.GenerateContentConfig(
                system_instruction=f"{SYSTEM_PROMPT}\n\nCONTEXT:\n{context}",
                max_output_tokens=MAX_TOKENS,
                # Without this, Gemini's internal "thinking" tokens eat into
                # max_output_tokens, silently truncating the visible reply
                # (seen live: a seva-price answer cut off after one header
                # line). This isn't a reasoning task, so thinking buys nothing.
                thinking_config=types.ThinkingConfig(thinking_budget=0),
            ),
        )
    except APIError as exc:
        logger.error("chat_agent.ask: Gemini API error: %s", exc)
        return "Sorry, I'm having trouble answering right now - please try again in a moment."

    return (response.text or "").strip()
