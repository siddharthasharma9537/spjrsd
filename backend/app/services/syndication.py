"""Mirror published news to the temple's other channels.

The website is the source of truth: news published here is echoed to the
Facebook Page so devotees who follow the Page see it without a second person
having to retype it.

Every channel is off unless its credentials are set, so this is inert until
they are. Nothing here is allowed to affect publishing on the website itself -
publish() swallows its own failures and logs them.

Google Business Profile is deliberately not implemented yet: its API needs
OAuth with a refresh token and access has to be requested from Google, unlike
the Page token this uses. Add it here once that access is granted.
"""

import logging
import os

import requests

logger = logging.getLogger(__name__)

SITE_URL = os.environ.get('SITE_URL', 'https://cheruvugattu.online').rstrip('/')

FB_PAGE_ID = os.environ.get('FB_PAGE_ID')
FB_PAGE_TOKEN = os.environ.get('FB_PAGE_TOKEN')
FB_GRAPH_VERSION = os.environ.get('FB_GRAPH_VERSION', 'v21.0')

TIMEOUT_SECONDS = 10


def render(item):
    """Build the post text for a news item.

    Telugu leads when it exists - the Page audience is largely Telugu-speaking -
    with the English underneath so both readerships get it in one post.
    """
    blocks = []

    title_te = (item.get('title_telugu') or '').strip()
    body_te = (item.get('content_telugu') or '').strip()
    if title_te or body_te:
        blocks.append('\n'.join(p for p in (title_te, body_te) if p))

    title_en = (item.get('title') or '').strip()
    body_en = (item.get('content') or '').strip()
    if title_en or body_en:
        blocks.append('\n'.join(p for p in (title_en, body_en) if p))

    return '\n\n'.join(blocks).strip()


def _post_to_facebook(message, link):
    response = requests.post(
        f'https://graph.facebook.com/{FB_GRAPH_VERSION}/{FB_PAGE_ID}/feed',
        data={'message': message, 'link': link, 'access_token': FB_PAGE_TOKEN},
        timeout=TIMEOUT_SECONDS,
    )
    response.raise_for_status()
    return response.json().get('id')


def publish(item):
    """Mirror one news item to every configured channel.

    Safe to call from a background task: it raises nothing.
    """
    message = render(item)
    if not message:
        logger.warning('Syndication skipped: news item %s has no text', item.get('id'))
        return

    link = f'{SITE_URL}/news'

    if not (FB_PAGE_ID and FB_PAGE_TOKEN):
        logger.info('Facebook syndication is not configured; skipping news %s', item.get('id'))
        return

    try:
        post_id = _post_to_facebook(message, link)
        logger.info('Mirrored news %s to Facebook post %s', item.get('id'), post_id)
    except requests.RequestException as exc:
        logger.error('Facebook syndication failed for news %s: %s', item.get('id'), exc)
