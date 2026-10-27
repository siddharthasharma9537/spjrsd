# Temple sites status            updated 2026-10-27 by Desk · Temple sites

Covers `spjrsd` (this repository, folder `spjrsd-src`; temple site `cheruvugattu.online`, Sri Parvathi Jadala Ramalingeshwara Swamy Devasthanam, Cheruvugattu), one temple among many that SoHum will serve. Any future temple website SoHum builds and runs gets its own section here. `~/Workspace/spjrsd` is not a git repository; it holds posters, packages and outputs. How this ledger works: `sohum-contracts` docs/OPERATING_MODEL.md.

**Darshan platform: see darshan-gateway STATUS.md.** Darshan (`darshan-gateway`, `darshan-web`) belongs to Desk · Darshan; this desk and Darshan meet only at the gateway's service endpoint (contract). Needs go through HQ.

Facts below were checked on 2026-10-27 unless marked. "Not verified" means exactly that.

## Now

- **Cut-over of the spjrsd backend to Cloud Run.** Letters A to D are the owner's change labels. **A and C are done; B and D are pending.**

| | Change | State |
|---|---|---|
| A | Website build variable `REACT_APP_BACKEND_URL` on Render static site `cheruvugattu-web` | **Done 2026-10-27**, verified |
| B | Meta WhatsApp webhook callback URL | Pending, the owner's in the Meta dashboard |
| C | GitHub Actions variable `BACKEND_URL` | **Done 2026-10-27 05:27 UTC** by HQ; workflows not run by hand |
| D | Cloud Build trigger for `backend/**` | Pending, not approved |

### A, done (set by HQ with the owner's approval)

`REACT_APP_BACKEND_URL` set to `https://spjrsd-backend-zcjttwuqqa-el.a.run.app`; Render deploy `dep-dbg39i59el5s73bp0rh0`, built from `main` at `fdbe25a`. Live bundle `static/js/main.fb7fdd04.js` has no `onrender.com`; its one backend address is the Cloud Run one. **Rollback:** set the variable back to `https://spjrsd-backend.onrender.com` and redeploy (that backend is suspended, so this restores a broken state; only if Cloud Run misbehaves). The rebuild also published whatever was on `main` since 2026-10-21.

Read-only checks after the deploy (no sign-in, booking, message or payment): `/sevas` lists the real sevas; a seva page shows its real description, price and samagri; `/admin/login` shows the staff form; Cloud Run answers 200 for `/api/sevas` (27), seva detail, `/api/slots/available?seva_id=&date=` (real slots), news, gallery, stotrams, accommodations and `panchangam/upcoming`. **Online booking is paused by design** (`BOOKINGS_PAUSED` in the frontend): seva pages tell devotees to contact the temple office, so no booking form exists to load. The only console error is a 404 for `/_vercel/insights/script.js` (Vercel analytics, older than this change; removable in a later code change). The browser tool does not list cross-origin calls, so "no onrender calls" rests on the bundle containing no such address, not a network log.

### B, pending: Meta WhatsApp webhook

Where: Meta App Dashboard, WhatsApp, Configuration, Webhooks. Old: not read (the callback lives only in Meta; expected to be the Render address, so the WhatsApp bot is probably down). New: `https://spjrsd-backend-zcjttwuqqa-el.a.run.app/api/whatsapp/webhook`; the verify token must equal `WHATSAPP_VERIFY_TOKEN` (in Secret Manager; the owner pastes it, no session handles it). Rollback: put the old URL back. Check after: message the temple's WhatsApp number.

### C, done: Actions variable `BACKEND_URL`

Set to `https://spjrsd-backend-zcjttwuqqa-el.a.run.app` by HQ on 2026-10-27 05:27 UTC. **Rollback:** delete the variable (workflows fall back to the suspended Render address). Before it, every scheduled run failed from 2026-10-24 16:53 UTC (live-blog publish about every 4 hours, Daily Aashirvachanam Blessings on 25 and 26 Oct, Weekly Panchangam Digest on 26 Oct). The three jobs only email signed-up devotees on their own dates, email subscribers on Mondays, and publish staff-scheduled posts; **nothing missed is resent**. The workflows have not been run by hand since the change. Not verified: that the next scheduled run succeeds (check the Actions tab; the Cloud Run `CRON_SECRET` came from Render's).

### D, pending: Cloud Build trigger

Where: Cloud Build in `sohum-509918`; repository `siddharthasharma9537/spjrsd`, branch `main`, included files `backend/**`, configuration `backend/cloudbuild.yaml`. Old: none. Rollback: delete the trigger. Effect: merging a backend change to `main` would deploy it. Not urgent.

### Cloud Run `spjrsd-backend` (read-only findings)

`https://spjrsd-backend-zcjttwuqqa-el.a.run.app`, revision `spjrsd-backend-00002-wp6`. `/api/health` ok, database ok, msg91, whatsapp and google_oauth configured; CORS allows `https://cheruvugattu.online`. 14 plain settings and 14 secrets present (names checked, never values). **`SEED_SECRET` is not set**, so `POST /api/seed` refuses everyone (safe); `SITE_URL` and `ANTHROPIC_API_KEY` are also unset.

After the cut-over (a pull request, no live effect): point the `.github/workflows` fallbacks and `frontend/scripts/generate-sitemap.js` at the new address; fix `docs/deploy/CLOUD_RUN.md`, `docs/PROJECT_SANNIDHI.md` and the README (Vercel, Render).

## Next

1. Owner does B (WhatsApp webhook) and approves D.
2. Confirm the next scheduled workflow run succeeds (C).
3. Upload the yearly panchangam (Vishvavasu 2025, Parabhava 2026, Plavanga 2027-28) from the engine to MongoDB: staging copy `spjrsd_staging.panchangam` first, dry run, then `--apply`, run by the owner (needs `MONGO_URL`). The earlier generated files were in a session scratchpad and are gone; regenerate with the engine (Panchangam repo, `integrations.temple_export`, now 2.6.0), which is Desk · Jyotisha's, so HQ routes. Not verified: how many days of `panchangam` the live database holds (a read-only count settles it).
4. **Stotram texts**: the 12 entries exist with empty `text_telugu`; the Devasthanam supplies the wording (admin, Stotrams). Telugu liturgy is never AI-authored.

## Blocked

- **SMS OTP**: needs Jio DLT steps 2 to 5 (step 1, PE registration, was the owner's; state unknown here): (2) sender ID `SPJRSD` under the PE, (3) each OTP template approved, (4) PE-TM chain binding with MSG91 as telemarketer (MSG91 confirmation form, then approve the chain on the DLT portal), (5) Entity/PE ID and sender ID entered in MSG91's "Add Sender ID Details". Until then e-mail OTP is the working path. Source: old session `local_1a91d509`.
- **Google Business Profile API approval**: syndication and review replies are inert without the `GBP_*` credentials; approval status unknown here. Source: old session `local_31f6ea5c`.
- **Panchangam upload** (Next 3) waits on the owner running it.

## Waiting on the owner

1. **B**: the WhatsApp webhook, including reading the current callback URL in Meta. Approve **D**.
2. Run the MongoDB panchangam upload (Next 3).
3. **Jio DLT steps 2 to 5** and **Google Business Profile API approval** (Blocked): the owner's accounts.
4. **`ANTHROPIC_API_KEY`** for the website chat agent (`intent_router.py`; without it intent classification falls back to menu replies). Decide: keep the chat agent (set the key) or retire it.
5. **Original panchangam source file** (for the 11 uncertain Vinayaka Chaturthi labels): probably moot, since data is engine-only since 2026-10-01 and the upload with `--overwrite` replaces those labels. Say so if the file still exists; otherwise it closes with the upload.
6. **Seed endpoints**: closed. `POST /api/seed` needs `X-Seed-Secret` and refuses everyone while `SEED_SECRET` is unset (it is, on Cloud Run); `POST /api/seed/stotrams` needs the `stotrams:create` permission. Nothing to do unless a fresh database is to be seeded.
7. **Cleanup proposals** (nothing done; each is the owner's call):
   - Merged-by-squash remote branches, safe to delete: `claude/google-review-replies`, `fix/review-reply-templates`, `fix/review-sync-paging`, `fix/review-sync-speed`, `fix/devotee-signin-and-ticket-lookup`, `samagri-api`, `claude/new-session-etjmny`, `feat/live-blog-pagination`, `claude/temple-digital-presence-naming-rlyugg` (merged PRs #20 to #24, #31, #47, #48).
   - `feat/panchangam-day-shape`: PR #19 closed unmerged, superseded by #33 and the engine-only decision; also exists locally.
   - `claude/website-mobile-app-conversion-4w4ybb` (5 Sept, 12 commits, no pull request, 224 files different from `main`): an Android/APK conversion far behind `main`. Keep as a reference or delete; revive only as a fresh step if an app is wanted.
   - Local `main` is 12 commits behind `origin/main`; no local changes, so a fast-forward is safe (not done).
8. The README still says the frontend is on Vercel; it is on Render behind Cloudflare. One-line docs fix for the next step that touches the README.

## Open pull requests

- #49: this ledger (`status/ledger`), awaiting review. No other open pull request in `spjrsd`.

## Live

Master document: `sohum-contracts` docs/SOHUM_SUITE_AND_CLOUD_CONSOLE.md, section 3.1, row **spjrsd** (not re-read after the cut-over; it still says the cut-over is unfinished).

- **Frontend**: Render static site `cheruvugattu-web` behind Cloudflare, calling the Cloud Run backend since change A (2026-10-27).
- **Backend**: Cloud Run `spjrsd-backend` (`sohum-509918`, `asia-south1`, revision `00002`) since 2026-10-25; the Render copy is suspended and not a fallback. No Cloud Build trigger yet (D), so merging does not deploy it.
- **Data**: MongoDB Atlas `sohum-cluster`, database `spjrsd`. Uploads: Cloudflare R2. Scheduled jobs: three GitHub Actions workflows calling `/api/cron/...`.
- On `main` (checked in code): ticket-lookup leak and Google sign-in fixes (#20); seed endpoint protection; Google review replies (#21 to #24); seva samagri API (#47).
