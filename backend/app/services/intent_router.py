"""Classifies a devotee's free-text message as either wanting to *do*
something transactional (book a seva, reserve accommodation, make a
donation, or cancel/modify an existing booking) or wanting to *talk* (ask
about prices, timings, panchangam, festivals, stotrams, temple history, or
anything else conversational).

This exists because the line isn't "mentions money" - "what does abhishekam
cost?" is conversational, "book abhishekam for tomorrow" isn't. Getting this
wrong in the "transact" direction just sends someone who wanted an answer to
the menu instead (mildly annoying, they can re-ask). Getting it wrong in the
"chat" direction is worse - it hands an actual booking/payment/donation
attempt to chat_agent.py, which can only talk and never act, so a devotee
could walk away believing something happened that didn't. So when uncertain,
this prefers "transact".

Kept separate from chat_agent.py on purpose: this decides *whether* to call
the brain, not what the brain says. Either half can then change independently
- a better classifier, a different model for chat - without touching the
other.
"""

import logging
import os
import re

import anthropic

logger = logging.getLogger(__name__)

ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY")
# Deliberately a small/fast/cheap model - this runs on every free-text
# message a devotee sends, before the (larger) chat_agent call even happens.
INTENT_ROUTER_MODEL = os.environ.get("INTENT_ROUTER_MODEL", "claude-haiku-4-5-20251001")
MAX_TOKENS = 5

_client = anthropic.AsyncAnthropic(api_key=ANTHROPIC_API_KEY) if ANTHROPIC_API_KEY else None

# Checked before any LLM call. Deliberately conservative: these verbs almost
# always mean "do it now", so there's no reason to spend a model call
# confirming it - and it means classification degrades to something rather
# than nothing if ANTHROPIC_API_KEY isn't set. Doesn't need to be exhaustive;
# anything it misses still goes through the classifier below.
_TRANSACT_KEYWORDS = re.compile(
    r"\b("
    r"book|reserve|reservation|cancel|refund|register|sign\s*up|"
    r"donate|donation|pay|payment"
    r")\b",
    re.IGNORECASE,
)

_SYSTEM_PROMPT = """Classify one message from a devotee at a Hindu temple as
either TRANSACT or CHAT.

TRANSACT = the devotee is trying to take an action right now: book a seva,
reserve accommodation, make a donation, or cancel/modify an existing booking.

CHAT = everything else: asking what something costs, when it happens, what a
seva involves, panchangam/festival questions, temple history, stotrams, or
any general question - including questions ABOUT booking, pricing, or
donating that don't attempt to actually do it.

Examples:
"what does abhishekam cost" -> CHAT
"book abhishekam for tomorrow morning" -> TRANSACT
"can I get a room for two nights" -> TRANSACT
"do you have rooms available" -> CHAT
"I want to donate for annadanam" -> TRANSACT
"what's rahu kalam today" -> CHAT
"cancel my booking" -> TRANSACT

Reply with exactly one word: TRANSACT or CHAT. Nothing else."""


def _keyword_fallback(message: str) -> str:
    """Used when no ANTHROPIC_API_KEY is set, or the classifier call fails.
    Conservative on purpose - see the module docstring on why "transact" is
    the safer side to fall back toward.
    """
    return "transact" if _TRANSACT_KEYWORDS.search(message) else "chat"


async def classify(message: str, history: list[dict] | None = None) -> str:
    """Returns "transact" or "chat" for one free-text devotee message.

    `history` (same [{"role", "content"}] shape chat_agent.ask takes) lets a
    short reply like "yes, that one" be read against what was just discussed
    - e.g. after "do you have rooms available" (CHAT), "book it" is TRANSACT
    even though "it" alone is meaningless out of context. Only the last couple
    of turns are sent to keep this call cheap; the keyword fallback ignores
    history entirely (it's a plain string match, added value would be marginal).
    """
    if _client is None:
        return _keyword_fallback(message)

    try:
        response = await _client.messages.create(
            model=INTENT_ROUTER_MODEL,
            max_tokens=MAX_TOKENS,
            system=_SYSTEM_PROMPT,
            messages=[*(history or [])[-4:], {"role": "user", "content": message}],
        )
    except anthropic.APIError as exc:
        logger.error("intent_router.classify: Claude API error, falling back to keywords: %s", exc)
        return _keyword_fallback(message)

    verdict = "".join(block.text for block in response.content if block.type == "text").strip().upper()
    if "TRANSACT" in verdict:
        return "transact"
    if "CHAT" in verdict:
        return "chat"

    logger.warning("intent_router.classify: unexpected verdict %r, falling back to keywords", verdict)
    return _keyword_fallback(message)
