"""Mirror published content to the temple's other channels.

The website is the source of truth: news and live blog posts published here
are echoed to the Facebook Page and Google Business Profile so devotees who
follow those instead see it without a second person having to retype it.

Every channel is off unless its credentials are set, so this is inert until
they are. Each channel is independent and swallows its own failures - one
channel being down or unconfigured never affects another, or the website
itself. Add a new channel by adding a _post_to_<channel>() function and a
call to it in publish(), following the same try/except-and-log shape.

Instagram isn't implemented yet, but rides the same Meta Graph API and Page
token as Facebook - much less setup than Google Business Profile needed.

Google Business Profile posting needs its API access explicitly granted by
Google (a Cloud project, OAuth consent, and an access request Google reviews)
before GBP_* below will do anything.
"""

import logging
import os

import requests

logger = logging.getLogger(__name__)

SITE_URL = os.environ.get('SITE_URL', 'https://cheruvugattu.online').rstrip('/')

FB_PAGE_ID = os.environ.get('FB_PAGE_ID')
FB_PAGE_TOKEN = os.environ.get('FB_PAGE_TOKEN')
FB_GRAPH_VERSION = os.environ.get('FB_GRAPH_VERSION', 'v21.0')

GBP_ACCOUNT_ID = os.environ.get('GBP_ACCOUNT_ID')
GBP_LOCATION_ID = os.environ.get('GBP_LOCATION_ID')
GBP_CLIENT_ID = os.environ.get('GBP_CLIENT_ID')
GBP_CLIENT_SECRET = os.environ.get('GBP_CLIENT_SECRET')
GBP_REFRESH_TOKEN = os.environ.get('GBP_REFRESH_TOKEN')

TIMEOUT_SECONDS = 10


def render(item):
    """Build the post text for a news or live blog item.

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


def _gbp_access_token():
    response = requests.post(
        'https://oauth2.googleapis.com/token',
        data={
            'client_id': GBP_CLIENT_ID,
            'client_secret': GBP_CLIENT_SECRET,
            'refresh_token': GBP_REFRESH_TOKEN,
            'grant_type': 'refresh_token',
        },
        timeout=TIMEOUT_SECONDS,
    )
    response.raise_for_status()
    return response.json()['access_token']


def _post_to_google_business_profile(message, link):
    access_token = _gbp_access_token()
    response = requests.post(
        f'https://mybusiness.googleapis.com/v4/accounts/{GBP_ACCOUNT_ID}/locations/{GBP_LOCATION_ID}/localPosts',
        headers={'Authorization': f'Bearer {access_token}'},
        json={
            'languageCode': 'en',
            'summary': message,
            'topicType': 'STANDARD',
            'callToAction': {'actionType': 'LEARN_MORE', 'url': link},
        },
        timeout=TIMEOUT_SECONDS,
    )
    response.raise_for_status()
    return response.json().get('name')


def publish(item, path='/news'):
    """Mirror one news or live blog item to every configured channel.

    `path` is the site path the mirrored post links back to - '/news' for a
    News item, '/live-blog' for a Live Blog post. Safe to call from a
    background task: it raises nothing.
    """
    message = render(item)
    if not message:
        logger.warning('Syndication skipped: item %s has no text', item.get('id'))
        return

    link = f'{SITE_URL}{path}'

    if FB_PAGE_ID and FB_PAGE_TOKEN:
        try:
            post_id = _post_to_facebook(message, link)
            logger.info('Mirrored %s to Facebook post %s', item.get('id'), post_id)
        except requests.RequestException as exc:
            logger.error('Facebook syndication failed for %s: %s', item.get('id'), exc)
    else:
        logger.info('Facebook syndication is not configured; skipping %s', item.get('id'))

    if GBP_ACCOUNT_ID and GBP_LOCATION_ID and GBP_CLIENT_ID and GBP_CLIENT_SECRET and GBP_REFRESH_TOKEN:
        try:
            post_name = _post_to_google_business_profile(message, link)
            logger.info('Mirrored %s to Google Business Profile post %s', item.get('id'), post_name)
        except requests.RequestException as exc:
            logger.error('Google Business Profile syndication failed for %s: %s', item.get('id'), exc)
    else:
        logger.info('Google Business Profile syndication is not configured; skipping %s', item.get('id'))
