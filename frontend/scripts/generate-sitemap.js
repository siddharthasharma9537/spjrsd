#!/usr/bin/env node
// Regenerates public/sitemap.xml before every build: the static pages below
// plus one <url> per active News and Live Blog item, fetched from the live
// backend, since those detail pages (see NewsDetail.jsx / LiveBlogDetail.jsx)
// are dynamic and can't be hand-listed. Runs as the "prebuild" npm lifecycle
// script, so `yarn build` / `npm run build` picks it up automatically.
//
// Best-effort: if the backend can't be reached, this logs a warning and
// falls back to just the static pages rather than failing the whole build.

const fs = require('fs');
const path = require('path');

const SITE_URL = 'https://cheruvugattu.online';
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'https://spjrsd-backend.onrender.com';
const OUT_PATH = path.join(__dirname, '..', 'public', 'sitemap.xml');

const STATIC_PAGES = [
  { loc: '/', changefreq: 'weekly', priority: '1.0' },
  { loc: '/about', changefreq: 'monthly', priority: '0.9' },
  { loc: '/sevas', changefreq: 'weekly', priority: '0.9' },
  { loc: '/paroksha-seva', changefreq: 'weekly', priority: '0.8' },
  { loc: '/donations', changefreq: 'monthly', priority: '0.8' },
  { loc: '/donations/annaprasadam', changefreq: 'monthly', priority: '0.8' },
  { loc: '/accommodation', changefreq: 'weekly', priority: '0.7' },
  { loc: '/booking/quick', changefreq: 'monthly', priority: '0.7' },
  { loc: '/print-ticket', changefreq: 'monthly', priority: '0.5' },
  { loc: '/news', changefreq: 'weekly', priority: '0.7' },
  { loc: '/live-blog', changefreq: 'daily', priority: '0.7' },
  { loc: '/gallery', changefreq: 'monthly', priority: '0.6' },
  { loc: '/media/gallery/videos', changefreq: 'monthly', priority: '0.5' },
  { loc: '/media/live-tv', changefreq: 'daily', priority: '0.6' },
  { loc: '/support/contact', changefreq: 'yearly', priority: '0.6' },
  { loc: '/support/faq', changefreq: 'monthly', priority: '0.5' },
  { loc: '/volunteer', changefreq: 'yearly', priority: '0.5' },
];

// News/live-blog ids are server-generated UUIDs, never user-entered text, so
// no escaping is needed for the URLs built from them.
async function fetchItemPages(endpoint, urlPrefix, changefreq) {
  try {
    const res = await fetch(`${BACKEND_URL}/api${endpoint}`);
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    const items = await res.json();
    return items.map((item) => ({ loc: `${urlPrefix}/${item.id}`, changefreq, priority: '0.6' }));
  } catch (err) {
    console.warn(`generate-sitemap: could not fetch ${endpoint} (${err.message}); omitting those pages`);
    return [];
  }
}

async function main() {
  const [newsPages, liveBlogPages] = await Promise.all([
    fetchItemPages('/news', '/news', 'monthly'),
    fetchItemPages('/live-blog', '/live-blog', 'weekly'),
  ]);

  const allPages = [...STATIC_PAGES, ...newsPages, ...liveBlogPages];

  const body = allPages
    .map((p) => `  <url><loc>${SITE_URL}${p.loc}</loc><changefreq>${p.changefreq}</changefreq><priority>${p.priority}</priority></url>`)
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`;

  fs.writeFileSync(OUT_PATH, xml);
  console.log(`generate-sitemap: wrote ${allPages.length} URLs (${newsPages.length} news, ${liveBlogPages.length} live blog) to ${OUT_PATH}`);
}

main();
