# SPJRSD — Sri Parvathi Jadala Ramalingeshwara Swamy Devastanam

Website and WhatsApp bot for **Sri Parvathi Jadala Ramalingeshwara Swamy Devastanam**, a temple in Cheruvugattu (Narketpally mandal, Nalgonda district, Telangana). Live at [cheruvugattu.online](https://cheruvugattu.online).

This is a monorepo with a FastAPI backend and a React frontend, covering the public site, an admin dashboard for temple staff, a devotee account system, and a WhatsApp chatbot — all backed by one MongoDB database.

## What it does

- **Public site** — temple history (Sthala Puranam), seva (ritual) listings and online booking, accommodation booking, donations, live blog / news, photo gallery, video/live TV, panchangam (Hindu calendar), stotrams, aashirvachanam (blessings), FAQ, volunteer and contact forms.
- **Devotee accounts** — sign up/sign in by email, Google OAuth, or WhatsApp OTP; manage family members; view booking and donation history; email verification flow.
- **Admin dashboard** (`/admin`) — staff-only CRUD for sevas, schedule slots, day profiles, accommodations, bookings, donations, gallery (uploads to Cloudflare R2), live blog, news, panchangam, stotrams, aashirvachanam, newsletter, devotee management, and contact messages.
- **WhatsApp chatbot** — a Meta Cloud API webhook (`backend/app/routes/whatsapp.py`) that answers devotee questions via native list/button menus, and a separate WhatsApp OTP channel for devotee login/registration.
- **Conversational AI agent** (optional, off by default) — free-text WhatsApp messages and a `POST /api/chat` endpoint (for a future website widget) that don't match a menu option are classified as either wanting to transact (book/pay/donate — kept on the deterministic menu, never handled by the AI) or wanting to ask a question (answered by Claude, grounded in live seva/panchangam/stotram/news data pulled fresh from MongoDB on every call). See `backend/app/services/chat_agent.py` (the shared "brain") and `backend/app/services/intent_router.py` (the transact-vs-chat classifier). Inert until `ANTHROPIC_API_KEY` is set.
- **Content syndication** — News and Live Blog posts auto-mirror to the temple's Facebook Page, and (pending Google's API approval) to its Google Business Profile, so the same post reaches all channels without retyping (`backend/app/services/syndication.py`).
- **Scheduled jobs** — GitHub Actions workflows trigger backend cron endpoints for a weekly panchangam digest email and periodic aashirvachanam blessings.

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

```bash
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # fill in the values you need (see below)
uvicorn app.main:app --reload
```

Backend env vars (see `backend/.env.example` for full descriptions of each):

- `MONGO_URL`, `DB_NAME`, `JWT_SECRET` — required to run at all.
- `MSG91_*` — SMS/email OTP and the admin newsletter "send alert" feature.
- `WHATSAPP_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_OTP_TEMPLATE_NAME` — WhatsApp OTP login/registration.
- `WHATSAPP_VERIFY_TOKEN`, `META_APP_SECRET` — inbound WhatsApp chatbot webhook.
- `GOOGLE_CLIENT_ID` — devotee "Sign in with Google" (must match the frontend's `REACT_APP_GOOGLE_CLIENT_ID`).
- `CRON_SECRET` — shared secret for the GitHub Actions-triggered cron endpoints.
- `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, `R2_PUBLIC_URL` — gallery image uploads to Cloudflare R2.
- `FB_PAGE_ID`, `FB_PAGE_TOKEN`, `FB_GRAPH_VERSION` — Facebook Page syndication (optional; feature is inert without them).
- `GBP_ACCOUNT_ID`, `GBP_LOCATION_ID`, `GBP_CLIENT_ID`, `GBP_CLIENT_SECRET`, `GBP_REFRESH_TOKEN`, `SITE_URL` — Google Business Profile syndication (optional; feature is inert without them).
- `ANTHROPIC_API_KEY`, `CHAT_AGENT_MODEL`, `INTENT_ROUTER_MODEL` — conversational AI agent (optional; feature is inert without `ANTHROPIC_API_KEY`).

### Frontend

```bash
cd frontend
npm install
npm start
```

Set `REACT_APP_GOOGLE_CLIENT_ID` (and any API base URL override) in `frontend/.env` to match the backend.

## Deployment

- **Backend** deploys to [Render](https://render.com); environment variables are managed there.
- **Frontend** deploys to [Vercel](https://vercel.com); `npm run build` runs `scripts/generate-sitemap.js` first to regenerate `sitemap.xml`, including News and Live Blog detail pages.
- Two GitHub Actions workflows (`.github/workflows/panchangam-digest.yml`, `.github/workflows/aashirvachanam-blessings.yml`) hit backend cron endpoints on a schedule, authenticated via the `CRON_SECRET` repository secret.

## Notes

- Almost everything lives in `backend/app/main.py` — it's large but not yet split into per-feature routers (only WhatsApp, contact, volunteer, and live-stream have their own route modules).
- Facebook and Google Business Profile syndication are additive channels: publishing a News or Live Blog post always saves to the site regardless of whether either channel is configured, and each channel's failure is logged without affecting the other.
