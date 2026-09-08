"""Watch Google Business Profile reviews and draft/post replies.

Scope: GBP only. Facebook dropped its Page-reviews API in 2018 (there's
nothing left to reply to there via API), and the website itself collects no
reviews, so GBP is the only channel where this is actually possible.

Policy: a 4-5 star review gets a drafted reply posted immediately - the
downside of a slightly generic "thank you" is low. A 1-3 star review only
ever gets drafted and queued in `review_replies` for an admin to edit and
approve from /admin/reviews - a wrong public reply to a complaint is not
something to risk on an LLM's first attempt.

Like syndication.py, this is inert until its env vars are set, and each
review is processed independently - one failing never blocks the rest.
"""

import logging
import os
import uuid
from datetime import datetime, timezone

import requests

from app.database.db import db
from app.services.syndication import (
    GBP_ACCOUNT_ID,
    GBP_LOCATION_ID,
    _gbp_access_token,
)

logger = logging.getLogger(__name__)

ANTHROPIC_API_KEY = os.environ.get('ANTHROPIC_API_KEY')
ANTHROPIC_MODEL = os.environ.get('ANTHROPIC_MODEL', 'claude-sonnet-5')

AUTO_REPLY_MIN_RATING = 4

TIMEOUT_SECONDS = 15

STAR_RATING_MAP = {
    'ONE': 1, 'TWO': 2, 'THREE': 3, 'FOUR': 4, 'FIVE': 5,
    'STAR_RATING_UNSPECIFIED': None,
}

FALLBACK_TEMPLATES = {
    5: "Thank you so much for your kind words and for visiting us. We look forward to welcoming you again.",
    4: "Thank you for your visit and your feedback. We're glad you had a good experience and will keep working to make it even better.",
    3: "Thank you for sharing your experience. We've noted your feedback and are working to improve. We hope to serve you better next time.",
    2: "We're sorry your visit didn't meet expectations. Your feedback matters to us and we're looking into it. Please do reach out to the temple office directly so we can help.",
    1: "We're sorry to hear about your experience. This isn't the standard we aim for. Please contact the temple office directly so we can understand and address what went wrong.",
}


def _configured():
    return bool(GBP_ACCOUNT_ID and GBP_LOCATION_ID)


def fetch_reviews():
    """All reviews currently on the GBP listing, newest first."""
    access_token = _gbp_access_token()
    response = requests.get(
        f'https://mybusiness.googleapis.com/v4/accounts/{GBP_ACCOUNT_ID}/locations/{GBP_LOCATION_ID}/reviews',
        headers={'Authorization': f'Bearer {access_token}'},
        timeout=TIMEOUT_SECONDS,
    )
    response.raise_for_status()
    return response.json().get('reviews', [])


def post_reply(review_name, comment):
    access_token = _gbp_access_token()
    response = requests.put(
        f'https://mybusiness.googleapis.com/v4/{review_name}/reply',
        headers={'Authorization': f'Bearer {access_token}'},
        json={'comment': comment},
        timeout=TIMEOUT_SECONDS,
    )
    response.raise_for_status()
    return response.json()


def _draft_with_llm(review_text, rating):
    if not ANTHROPIC_API_KEY:
        return None

    prompt = (
        "You are replying, on behalf of a Hindu temple's management, to a public Google review. "
        f"Star rating: {rating}/5. Review text: \"{review_text}\"\n\n"
        "Write a short (2-4 sentence), warm, respectful public reply. Identify the review's actual "
        "subject (crowding, timings, cleanliness, darshan queue, parking, staff behaviour, prasadam, "
        "praise with no specific complaint, etc.) and address that subject specifically rather than "
        "replying generically. Do not invent facts, promises, dates, or numbers that were not in the "
        "review. Do not use emojis. Sign off with 'Thank you, Visit again.' Reply with only the reply "
        "text, nothing else."
    )
    try:
        response = requests.post(
            'https://api.anthropic.com/v1/messages',
            headers={
                'x-api-key': ANTHROPIC_API_KEY,
                'anthropic-version': '2023-06-01',
                'content-type': 'application/json',
            },
            json={
                'model': ANTHROPIC_MODEL,
                'max_tokens': 300,
                'messages': [{'role': 'user', 'content': prompt}],
            },
            timeout=TIMEOUT_SECONDS,
        )
        response.raise_for_status()
        content = response.json().get('content', [])
        text = ''.join(block.get('text', '') for block in content if block.get('type') == 'text').strip()
        return text or None
    except Exception:
        logger.exception('LLM reply drafting failed; falling back to template')
        return None


def draft_reply(review_text, rating):
    """Best-effort LLM draft, falling back to a rating-keyed template."""
    fallback = FALLBACK_TEMPLATES.get(rating, FALLBACK_TEMPLATES[3])
    if not review_text:
        return fallback
    return _draft_with_llm(review_text, rating) or fallback


async def process_new_reviews():
    """Fetch current GBP reviews, draft a reply for any not seen before.

    4-5 star reviews are posted immediately; 1-3 star reviews are queued in
    `review_replies` with status "pending_approval" for admin review.
    Returns a summary dict for the caller (the cron route) to report back.
    """
    if not _configured():
        logger.info('Review agent skipped: GBP is not configured')
        return {'configured': False, 'processed': 0, 'auto_replied': 0, 'queued': 0}

    reviews = fetch_reviews()
    processed = auto_replied = queued = 0

    for review in reviews:
        review_name = review.get('name')
        if not review_name:
            continue

        existing = await db.review_replies.find_one({'gbp_review_name': review_name}, {'_id': 0})
        if existing:
            continue

        rating = STAR_RATING_MAP.get(review.get('starRating'))
        comment_text = (review.get('comment') or '').strip()
        reviewer = (review.get('reviewer') or {}).get('displayName', 'A visitor')

        reply_text = draft_reply(comment_text, rating or 3)

        record = {
            'id': str(uuid.uuid4()),
            'gbp_review_name': review_name,
            'reviewer_name': reviewer,
            'rating': rating,
            'review_text': comment_text,
            'draft_reply': reply_text,
            'status': 'pending_approval',
            'posted_reply': None,
            'created_at': datetime.now(timezone.utc).isoformat(),
            'decided_at': None,
        }

        if rating is not None and rating >= AUTO_REPLY_MIN_RATING:
            try:
                post_reply(review_name, reply_text)
                record['status'] = 'auto_replied'
                record['posted_reply'] = reply_text
                record['decided_at'] = datetime.now(timezone.utc).isoformat()
                auto_replied += 1
                logger.info('Auto-replied to GBP review %s (%s stars)', review_name, rating)
            except requests.RequestException:
                logger.exception('Failed to post auto-reply for review %s; queuing for admin instead', review_name)
                queued += 1
        else:
            queued += 1

        await db.review_replies.insert_one(record)
        processed += 1

    return {'configured': True, 'processed': processed, 'auto_replied': auto_replied, 'queued': queued}
