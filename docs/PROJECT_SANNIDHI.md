# Project Sannidhi

**Sannidhi** ("divine presence") is the umbrella project for the temple's unified
digital presence — Sri Parvathi Jadala Ramalingeshwara Swamy Devasthanam
(SPJRSD), Cheruvugattu — across the website, Google Business Profile, and
Facebook Page.

This document records what has been built so far. It is a status snapshot,
not a plan — see `PROJECT_SETU.md` for what comes next.

## 1. Website (live at cheruvugattu.online)

Stack: React (Create React App + CRACO, Tailwind, shadcn/ui components) on the
frontend, FastAPI + MongoDB on the backend. Frontend deploys as a static
build; backend runs on Render (`spjrsd-backend.onrender.com`). Analytics via
Vercel Analytics.

### Public content pages
- Home, About the Temple (Sthala Puranam & history), Temples of the Kshetram
  (hilltop shrines, Sri Parvathi Devi Temple, Sri Narasimha Swamy Temple, Sri
  Swamy Vari Padalu)
- Stotrams (Telugu, chanted during Abhishekam/Archana/Rudra Abhishekam)
- Daily Panchangam (Tithi, Nakshatra, sunrise/sunset, auspicious timings)
- News & Events, Live Blog (real-time festival updates), Live TV
- Photo Gallery, Video Gallery
- FAQ, Contact Us, Volunteer registration
- Personalized Aashirvachanam signup (birthday/anniversary blessing emails —
  automated via a GitHub Actions workflow)

### Devotee-facing booking & account features
All of this already exists in the codebase — it is not a separate system to
be built later:
- Seva booking (Pratyaksha and Paroksha/remote seva), Quick Booking (no
  account needed), seva samagri checklist
- Accommodation booking (AC rooms, cottages, dormitory)
- Ticket generation, ticket lookup/reprint by booking number or mobile
  number, "My Bookings" and "My Family" for devotee accounts
- Devotee auth: sign up/sign in, OTP login (SMS via MSG91, WhatsApp via Meta
  Cloud API), Google Sign-In, forgot password
- Donations: e-Hundi, Annadanam/AnnaPrasadam sponsorship, 80G receipt
  generation
- Inbound WhatsApp chatbot webhook

**Currently paused / mocked, by deliberate design:**
- `BOOKINGS_PAUSED = true` — seva and accommodation booking forms are
  disabled sitewide (info-only pages shown instead of a submit flow)
- `DONATION_FORM_PAUSED = true` — the donation form has no real payment
  gateway behind it; submitting it produces a **mocked** "Paid" record and a
  receipt for a donation that never happened. The genuine QR code / bank
  transfer / UPI details on the same page remain live and unaffected.
- Ticket and donation-receipt "Payment Status" throughout the UI reflects
  this mocked state, not a real transaction.

### Admin panel (`/admin/*`)
Dashboard, Sevas, Slots, Bookings, Devotees (+ detail view), Accommodations,
Donations, News, Panchangam, Live Blog, Gallery, Stotrams, Newsletter,
Contact Messages, Aashirvachanam — a full back-office for temple staff to run
all of the above.

### Integrations already wired
- MSG91 — SMS + email OTP, newsletter "Send Email Alert"
- WhatsApp (Meta Cloud API) — OTP delivery and an inbound chatbot webhook
- Google OAuth — devotee "Sign in / up with Google"
- GitHub Actions cron — weekly Panchangam digest email, Aashirvachanam
  blessing emails
- Auto-generated `sitemap.xml` (prebuild step, pulls in live News/Live Blog
  items from the backend)

## 2. Google Business Profile

*Status: not yet documented in this repo — record current listing details,
verification status, and category/hours here, or note that it still needs to
be created/claimed.*

## 3. Facebook Page

*Status: not yet documented in this repo — record the page URL, verification
status, and posting cadence here, or note that it still needs to be
created/claimed.*

## Summary

The website itself is the most mature piece of Sannidhi: content, devotee
accounts, and a full booking/ticketing engine already exist end-to-end, gated
behind a deliberate pause on real money movement (booking + donations).
Google Business Profile and Facebook are the two legs of Sannidhi not yet
reflected anywhere in this codebase and need their current status recorded
(or the presence created, if it doesn't exist yet).
