# SPJRSD — Sri Parvathi Jadala Ramalingeshwara Swamy Devastanam

Website and WhatsApp bot for **Sri Parvathi Jadala Ramalingeshwara Swamy Devastanam**, a temple in Cheruvugattu (Narketpally mandal, Nalgonda district, Telangana). Live at [cheruvugattu.online](https://cheruvugattu.online).

This is a monorepo with a FastAPI backend and a React frontend, covering the public site, an admin dashboard for temple staff, a devotee account system, and a WhatsApp chatbot — all backed by one MongoDB database.

## What it does

- **Public site** — temple history (Sthala Puranam), seva (ritual) listings and online booking, accommodation booking, donations, live blog / news, photo gallery, video/live TV, panchangam (Hindu calendar), stotrams, aashirvachanam (blessings), FAQ, volunteer and contact forms.
- **Devotee accounts** — sign up/sign in by email, Google OAuth, or WhatsApp OTP; manage family members; view booking and donation history; email verification flow. Google sign-in links only to an existing account whose email is verified. Ticket lookup by mobile e-mails the tickets to the booking account instead of showing them (a mobile number isn't a secret); lookup by booking number is unchanged.
- **Admin dashboard** (`/admin`) — staff-only CRUD for sevas, schedule slots, day profiles, accommodations, bookings, donations, gallery (uploads to Cloudflare R2), live blog, news, panchangam, stotrams, aashirvachanam, newsletter, devotee management, and contact messages. Also a **Counter Sale** screen for in-person ticket-counter staff (Cashier role) to sell sevas against their own reserved slot capacity, and a **Staff** screen (EO-only) for creating and managing admin accounts. The sidebar groups daily screens under *Bookings & Counter*, *Content* and *Devotees*; rarely-changed set-up screens (sevas, day profiles, slots, accommodation, user accounts, roles, counters) open from cards on the **Settings** page, which also has an *Open sidebar on hover* switch. The sidebar never animates its width: collapsed it is a short icon rail (Dashboard plus one icon per section; hovering or pressing Enter on a section opens a menu of its screens), and expanding unfolds every section in place over the page, so the section icons slide apart to their headings (and back together on collapse). Admin screens show their last-loaded data at once and refresh in the background (all except Counter Sale, Counter Reports and Scan Ticket, which always load live figures) (`useCachedGet` in `frontend/src/lib/cachedGet.js`; kept per browser tab and cleared on login/logout), and resting the pointer on their sidebar links or Settings cards starts the fetch early. Staff can install the admin as an app from Chrome's menu (*Install*): admin pages link `admin.webmanifest` ("Temple Admin", opens at `/admin`), while the public site links `manifest.webmanifest`, so a visitor installing from the home page gets the site. On phones the sidebar becomes a short header with a menu button, and every list screen shows one card per row (with full-size action buttons) instead of a wide table; only the Roles permissions grid keeps a sideways scroll. A floating **Staff To-do** button in the corner of every admin page holds a shared task list: the EO (or a role with `tasks` permissions) assigns tasks to a person or a whole role, and the person answers with *Working on it*, *Completed*, *Need help* or a note, chat-style, optionally with up to 4 images (picked, pasted or dropped; shrunk in the browser) and/or a voice message of up to 2 minutes, both stored in R2 under `tasks/<task id>/`. A mic in the message box turns speech into text (Telugu or English) using the browser's own speech recognition (Chrome / Edge). *Need help* flags the task for the EO and emails `TASK_ALERT_EMAIL`.
- **WhatsApp chatbot** — a Meta Cloud API webhook (`backend/app/routes/whatsapp.py`) that answers devotee questions via native list/button menus, and a separate WhatsApp OTP channel for devotee login/registration. Menu replies are fixed text in that file, except Accommodation, which lists the active rooms and prices from MongoDB so it always matches the website.
- **Conversational AI agent** (optional, off by default) — free-text WhatsApp messages and a `POST /api/chat` endpoint (for a future website widget) that don't match a menu option are classified as either wanting to transact (book/pay/donate — kept on the deterministic menu, never handled by the AI) or wanting to ask a question (answered by Claude, grounded in live seva/panchangam/stotram/news data pulled fresh from MongoDB on every call). See `backend/app/services/chat_agent.py` (the shared "brain") and `backend/app/services/intent_router.py` (the transact-vs-chat classifier). Inert until `ANTHROPIC_API_KEY` is set.
- **Content syndication** — News and Live Blog posts auto-mirror to the temple's Facebook Page and Google Business Profile, and Live Blog posts with a JPEG image also go to Instagram, so the same post reaches all channels without retyping. The admin Live Blog page has **Published / Scheduled / Drafts** tabs: a post can be published now, scheduled for a date and HH:MM (India time), or saved as a draft, and scheduled posts and drafts stay editable (time, channels, a staff-only note, content) until they go out. Each post has its own Facebook / Google / Instagram / *Also show in News* checkboxes. Its photo can be uploaded straight from the post form (on a phone, from the camera or gallery): the browser shrinks it to a 1600px JPEG, so it stays Instagram-eligible, and `POST /api/admin/live-blog/upload` stores it in R2 under `live-blog/` for anyone with `live_blog:create` or `live_blog:edit`; pasting an image link still works. Scheduled posts stay hidden on the site until their time and are mirrored by the `/api/cron/live-blog-publish` endpoint. When creating a News item in the admin panel, two checkboxes let the team opt that post out of Google and/or Facebook (both on by default; long posts are shortened to Google's 1,500-character limit) (`backend/app/services/syndication.py`).
- **Google review replies** — the admin Reviews screen (`/admin/reviews`, `reviews:view` / `reviews:edit`) pulls the newest 200 reviews from the Google Business Profile (the listing has thousands, newest first), drafts a reply by star rating, and posts only what staff approve. Reviews are cached in `google_reviews`; a re-sync never re-drafts a review it already holds.
- **Scheduled jobs** — GitHub Actions workflows trigger backend cron endpoints for a weekly panchangam digest email, periodic aashirvachanam blessings, and mirroring scheduled Live Blog posts (every 15 minutes). GitHub runs scheduled workflows late, often by hours, so time-sensitive mirroring should also be triggered from a punctual scheduler calling the same endpoint.

## Stack

| | |
|---|---|
| Backend | FastAPI (Python), MongoDB via Motor/PyMongo, JWT auth |
| Frontend | React 19 (Create React App + CRACO), React Router, Tailwind CSS, Radix UI |
| File storage | Cloudflare R2 (S3-compatible) for gallery images |
| Messaging | Meta WhatsApp Cloud API (chatbot + OTP), MSG91 (SMS/email OTP) |
| Auth | JWT (devotees + admin), Google OAuth, WhatsApp/SMS/email OTP |
| Deployment | Backend on Render, frontend on Vercel |

## Repo layout

```
packages/
├── backend/
│   ├── app/
│   │   ├── main.py          # most routes, models, and business logic live here
│   │   ├── routes/          # whatsapp.py, contact.py, volunteer.py, live_stream.py, visitor.py, chat.py
│   │   ├── services/        # syndication.py (Facebook / GBP mirroring), chat_agent.py + intent_router.py (AI chat)
│   │   ├── core/            # shared dependencies (auth, db)
│   │   ├── database/
│   │   ├── models/
│   │   └── schemas/
│   ├── requirements.txt
│   └── .env.example
└── frontend/
    ├── src/
    │   ├── pages/            # public pages
    │   ├── pages/admin/       # admin dashboard pages
    │   ├── components/
    │   ├── contexts/
    │   └── lib/
    └── package.json
```

## Local setup

### Backend

Needs MongoDB: either a local `mongod` (e.g. `brew tap mongodb/brew && brew install mongodb-community`) or an Atlas connection string.

```bash
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example app/.env   # note: app/.env, not backend/.env
uvicorn app.main:app --reload --port 8000 --env-file app/.env
```

In `app/.env`, set at least `MONGO_URL` (e.g. `mongodb://127.0.0.1:27017`), `DB_NAME` (e.g. `spjrsd_local`, so a local database is never mistaken for production), a random `JWT_SECRET`, a random `SEED_SECRET`, and `CORS_EXTRA_ORIGINS=http://localhost:3000` so the frontend dev server can call the API.

`--env-file` is needed: `app/main.py` connects to the database while importing its routes, before its own `load_dotenv` call runs, so without the flag the server stops with *MONGO_URL is not set*.

A brand-new database is empty. With the backend running, load the first admin account (username `admin`) and sample sevas, slots, rooms, news, gallery, panchangam and live-blog posts:

```bash
curl -X POST -H "X-Seed-Secret: <your SEED_SECRET>" http://localhost:8000/api/seed
```

The admin's starting password is set in `seed_data()` in `app/main.py`; change it from Settings after the first login. The seed does nothing once an admin account exists.

Backend env vars (see `backend/.env.example` for full descriptions of each):

- `MONGO_URL`, `DB_NAME`, `JWT_SECRET` — required to run at all.
- `CORS_EXTRA_ORIGINS` — local development only: comma-separated extra origins the API accepts browser requests from, e.g. `http://localhost:3000` for the frontend dev server. Leave unset in production, where only the cheruvugattu.online origins are allowed.
- `MSG91_*` — SMS/email OTP and the admin newsletter "send alert" feature.
- `WHATSAPP_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_OTP_TEMPLATE_NAME` — WhatsApp OTP login/registration.
- `WHATSAPP_VERIFY_TOKEN`, `META_APP_SECRET` — inbound WhatsApp chatbot webhook.
- `GOOGLE_CLIENT_ID` — devotee "Sign in with Google" (must match the frontend's `REACT_APP_GOOGLE_CLIENT_ID`).
- `CRON_SECRET` — shared secret for the GitHub Actions-triggered cron endpoints.
- `SEED_SECRET` — shared secret for `POST /api/seed`, which creates the platform's first EO account. Unset means the endpoint is disabled outright, not "open."
- `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, `R2_PUBLIC_URL` — gallery image uploads to Cloudflare R2.
- `FB_PAGE_ID`, `FB_PAGE_TOKEN`, `FB_GRAPH_VERSION` — Facebook Page syndication (optional; feature is inert without them).
- `IG_USER_ID` — the Instagram business account linked to the Facebook Page; with `FB_PAGE_TOKEN` (which needs `instagram_basic` + `instagram_content_publish`) it enables Instagram syndication of Live Blog posts.
- `TASK_ALERT_EMAIL` — optional; comma-separated address(es) emailed when someone taps *Need help* on a Staff To-do task (sent through the same MSG91 email setup). Without it, the task is still flagged on the dashboard.
- `GBP_ACCOUNT_ID`, `GBP_LOCATION_ID`, `GBP_CLIENT_ID`, `GBP_CLIENT_SECRET`, `GBP_REFRESH_TOKEN`, `SITE_URL` — Google Business Profile syndication (optional; feature is inert without them).
- `ANTHROPIC_API_KEY`, `CHAT_AGENT_MODEL`, `INTENT_ROUTER_MODEL` — conversational AI agent (optional; feature is inert without `ANTHROPIC_API_KEY`).

### Frontend

```bash
cd frontend
cp .env.example .env   # REACT_APP_BACKEND_URL defaults to http://localhost:8000
yarn install
yarn start             # http://localhost:3000
```

Use yarn, not npm: the lockfile is `yarn.lock`. Run the tests with `CI=true yarn craco test --watchAll=false`.

`REACT_APP_BACKEND_URL` is baked in when the dev server starts or a build is made, so restart `yarn start` after changing it. Set `REACT_APP_GOOGLE_CLIENT_ID` to the backend's `GOOGLE_CLIENT_ID` to show the Google sign-in button; leave it empty to hide it.

## Deployment

- **Backend** deploys to [Render](https://render.com); environment variables are managed there.
- **Frontend** deploys to [Vercel](https://vercel.com); `npm run build` runs `scripts/generate-sitemap.js` first to regenerate `sitemap.xml`, including News and Live Blog detail pages.
- Three GitHub Actions workflows (`.github/workflows/panchangam-digest.yml`, `.github/workflows/aashirvachanam-blessings.yml`, `.github/workflows/live-blog-publish.yml`) hit backend cron endpoints on a schedule, authenticated via the `CRON_SECRET` repository secret.

## Notes

- Almost everything lives in `backend/app/main.py` — it's large but not yet split into per-feature routers (only WhatsApp, contact, volunteer, and live-stream have their own route modules).
- Facebook and Google Business Profile syndication are additive channels: publishing a News or Live Blog post always saves to the site regardless of whether either channel is configured, and each channel's failure is logged without affecting the other.

## Panchangam data

The panchangam pages, the homepage widget, the weekly digest and the chat assistant all read the MongoDB collection `panchangam` (one entry per date). The entries come from the SoHum Surya Siddhanta Ganitha Panchangam engine (repo `siddharthasharma9537/Panchangam`, folder `integrations/`), which builds them in this collection's own format and uploads them:

- **Once a year**, about two months before Ugadi, the engine generates the coming Telugu year, it is compared with the printed book, and it is uploaded (`upload` first as a dry run, on a staging copy, then with `--apply`). Without `--overwrite` existing dates are left alone, so edits made in the admin Panchangam screen are kept; with `--overwrite` every field of the uploaded dates is replaced by the engine's value.
- **Keep it ahead of today.** The date picker reaches 365 days ahead (dates with no entry show "not available yet") and the homepage widget disappears when today has no entry. The engine's `check` command warns when fewer than 90 days remain.
- The data is kept by Telugu year, Ugadi to Ugadi (`generate-year`). Parabhava (19 Mar 2026 to 6 Apr 2027) is uploaded, with `--overwrite`; the next is Plavanga, from 7 Apr 2027.
- The full panchangam page (`/panchangam`) shows six cards from a day's entry: Panchanga, Sankalpam, Upcoming festivals, Auspicious & inauspicious timings, Important times and Additional details. Entries from the engine carry the fields for all of them (samvatsara, ritu, vasara, karanas, Amrita Kalam, the sandhyas, the Moon's sign and phase, the sankalpam, observances ...); an older entry without them shows the rows it has. Upcoming festivals come from `GET /api/panchangam/upcoming?date=&limit=`, the next days' non-recurring observances.
- The homepage news ticker starts with automatic *Today / Tomorrow* reminders built from these entries (`GET /api/panchangam/reminders`): the day's special note (book symbols like "Star symbol" / "Blank Circle" dropped), plus Amavasya, Pournami, Masa Shivaratri and Karthika Somavaram. Nothing is stored; each reminder disappears after its day, and editing a day's special note in the admin Panchangam changes its reminder.
- The special note lists every observance of the day, the recurring ones (Ekadashi, Amavasya, Pradosham, the kartes and so on) included, so the weekly digest and the ticker show them too.

## Project planning docs

This codebase is organized under two named initiatives, documented in full under `docs/`:

- **Sannidhi** ("divine presence") — the temple's unified digital presence across the website, Google Business Profile, and Facebook Page. See [`docs/PROJECT_SANNIDHI.md`](docs/PROJECT_SANNIDHI.md) for what's been built so far.
- **Setu** ("bridge") — turning the booking/ticketing engine from its current mocked-payment state into a live, paid booking flow reachable from the website, WhatsApp, and the temple's ticket counter. See [`docs/PROJECT_SETU.md`](docs/PROJECT_SETU.md) for the plan and open questions.

There's also:
- [`docs/LOCAL_MIRROR_SYNC.md`](docs/LOCAL_MIRROR_SYNC.md) and `ops/local-mirror/`, spec'ing an optional read-only local database mirror for temple office staff.
- [`docs/ROLES_AND_PERMISSIONS.md`](docs/ROLES_AND_PERMISSIONS.md), spec'ing a configurable role/permission system so the EO can create new roles (e.g. Accountant, Help Desk) and control which admin screens each one can see, replacing today's fixed 4-role list.
