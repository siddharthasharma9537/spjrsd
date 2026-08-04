import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';

export const SITE_NAME = 'Sri Parvathi Jadala Ramalingeshwara Swamy Devasthanam';
export const SITE_ORIGIN = 'https://cheruvugattu.online';

function setMeta(selector, attr, key, content) {
  if (!content) return;
  let el = document.head.querySelector(selector);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function setLink(rel, href) {
  let el = document.head.querySelector(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', rel);
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

/**
 * Sets per-route document title, description, canonical and the OG/Twitter
 * fields that vary by page.
 *
 * NOTE: this runs client-side. Google renders JS and will pick these up, but
 * WhatsApp/Facebook/Twitter crawlers do NOT execute JS - they read the static
 * HTML only. The site-wide OG defaults in public/index.html are what those
 * scrapers see. Per-route social cards would need SSR or build-time
 * prerendering; see README notes.
 */
export default function usePageMeta({ title, description, noIndex = false } = {}) {
  const { pathname } = useLocation();
  const language = useLanguage();
  const lang = language?.lang || 'en';

  useEffect(() => {
    const full = title ? `${title} | ${SITE_NAME}` : SITE_NAME;
    document.title = full;

    // Telugu content must not be announced with English pronunciation rules.
    document.documentElement.setAttribute('lang', lang === 'te' ? 'te' : 'en');

    const url = `${SITE_ORIGIN}${pathname}`;
    setMeta('meta[name="description"]', 'name', 'description', description);
    setMeta('meta[property="og:title"]', 'property', 'og:title', full);
    setMeta('meta[property="og:description"]', 'property', 'og:description', description);
    setMeta('meta[property="og:url"]', 'property', 'og:url', url);
    setMeta('meta[name="twitter:title"]', 'name', 'twitter:title', full);
    setMeta('meta[name="twitter:description"]', 'name', 'twitter:description', description);
    setLink('canonical', url);

    let robots = document.head.querySelector('meta[name="robots"]');
    if (noIndex) {
      if (!robots) {
        robots = document.createElement('meta');
        robots.setAttribute('name', 'robots');
        document.head.appendChild(robots);
      }
      robots.setAttribute('content', 'noindex');
    } else if (robots) {
      robots.remove();
    }
  }, [title, description, noIndex, pathname, lang]);
}
