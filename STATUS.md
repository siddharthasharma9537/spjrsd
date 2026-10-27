# Temple & Darshan status            updated 2026-10-27 by Desk · Temple & Darshan

Covers three repositories: `spjrsd` (this one, folder `spjrsd-src`; temple site `cheruvugattu.online`), `darshan-gateway` and `darshan-web`. `~/Workspace/spjrsd` is not a git repository; it holds posters, packages and outputs. How this ledger works: `sohum-contracts` docs/OPERATING_MODEL.md.

Checked on 2026-10-27 by reading git and GitHub only. Nothing was deployed, merged or written to a live system, and no live endpoint was called. "Not verified" below means exactly that.

## Now

- **Cut-over of the spjrsd backend to Cloud Run: change A (website) is done and verified, 2026-10-27.** Changes B, C and D below are not approved and not done.

### Change A, done 2026-10-27 (set by HQ with the owner's approval)

`REACT_APP_BACKEND_URL` on Render static site `cheruvugattu-web` set to `https://spjrsd-backend-zcjttwuqqa-el.a.run.app`; deploy `dep-dbg39i59el5s73bp0rh0` built from `main` at `fdbe25a`. Live bundle `static/js/main.fb7fdd04.js` on `cheruvugattu.online` has no `onrender.com` and one backend address, the Cloud Run one. **Rollback:** set the variable back to `https://spjrsd-backend.onrender.com` and redeploy (that backend is suspended, so this restores a broken state; use only if Cloud Run misbehaves). Side effect: the rebuild also published whatever was on `main` since 2026-10-21.

Read-only checks after the deploy (no sign-in, no booking, no message, no payment): `/sevas` shows the seva list with real data; a seva page (`/book/<id>`) shows its real description, price and samagri list; `/admin/login` shows the staff sign-in form; Cloud Run answers 200 to `/api/sevas` (27 sevas), seva detail, `/api/slots/available?seva_id=&date=` (real slots with remaining counts), `/api/news`, `/api/gallery`, `/api/stotrams`, `/api/accommodations`, `/api/panchangam/upcoming`. **Online booking is paused by design** (`BOOKINGS_PAUSED` in the frontend): the seva page says to contact the temple office, so there is no booking form to load. The only console error is a 404 for `/_vercel/insights/script.js` (Vercel analytics, pre-existing, unrelated; it can be removed in a later code change). The browser tool does not list cross-origin calls, so "no onrender calls" rests on the bundle having no such address, not on a network log.

### Cut-over findings (read-only, 2026-10-27)

- **GitHub Actions**: the repository has **no Actions variables**, so `BACKEND_URL` is unset and all three workflows use `https://spjrsd-backend.onrender.com`. Since Render suspended it (the first failure is 2026-10-24 16:53 UTC) every scheduled run has failed: live-blog publish every run (about 17 runs to 2026-10-27 01:16 UTC), Daily Aashirvachanam Blessings on 25 and 26 Oct, Weekly Panchangam Digest on 26 Oct. Scheduled live-blog posts, the daily blessings and the weekly digest have not gone out since 24 Oct.
- **Temple site**: `cheruvugattu.online` is a Render static site (`cheruvugattu-web`, response header `rndr-id`) behind Cloudflare. The live bundle `main.63eea90f.js` calls **`https://spjrsd-backend.onrender.com`** (the only backend address in it). `GET https://spjrsd-backend.onrender.com/api/health` answers 503 today. So the website's booking, sevas and admin calls fail now. The address is baked in at build time (`REACT_APP_BACKEND_URL`), so a rebuild is needed.
- **Cloud Run `spjrsd-backend`** (`https://spjrsd-backend-zcjttwuqqa-el.a.run.app`, revision `spjrsd-backend-00002-wp6`): `/api/health` ok, database ok, msg91, whatsapp and google_oauth configured. CORS preflight from `https://cheruvugattu.online` is allowed. It has the 14 plain settings and the 14 secrets from the deploy doc. **`SEED_SECRET` is not set**, so `POST /api/seed` answers 401 to everyone (the code refuses when it is unset): safe. `SITE_URL` and `ANTHROPIC_API_KEY` are also not set.
- **Meta WhatsApp webhook**: its registered callback URL lives only in the Meta App Dashboard (WhatsApp, Configuration, Webhooks); it is not in the code or in Cloud Run. Not read. The owner must look there: it is expected to be the Render address, so the WhatsApp bot is down.
- **Other `onrender.com` references**: `frontend/scripts/generate-sitemap.js` (fallback for the build step, best effort, harmless once the build variable is set), the three workflow fallbacks, docs (`docs/PROJECT_SANNIDHI.md`, `docs/deploy/CLOUD_RUN.md` history), `darshan-web/.env.example` (`NEXT_PUBLIC_API_URL=https://darshan-gateway.onrender.com`, an example file only). `darshan-gateway` has none in code (its setting is a Cloud Run variable, changed 2026-10-25).

### Live changes needed (nothing done; the owner approves each)

1. **(B) GitHub Actions variable `BACKEND_URL`.** Where: github.com/siddharthasharma9537/spjrsd, Settings, Secrets and variables, Actions, Variables. Old: not set. New: `https://spjrsd-backend-zcjttwuqqa-el.a.run.app`. Then run the three workflows once from the Actions tab and check each succeeds (the cron secret must match; the Cloud Run `CRON_SECRET` came from Render's). Roll back: delete the variable (workflows return to the Render address). Side effect to know: the first live-blog run will publish any scheduled posts that are overdue, and the blessings and digest send to real recipients.
2. **(A, DONE) Website build variable `REACT_APP_BACKEND_URL`.** Where: Render dashboard, static site `cheruvugattu-web`, Environment. Old: `https://spjrsd-backend.onrender.com` (as seen in the bundle; the variable itself was not read). New: the same Cloud Run address. Then trigger a deploy on that site (rebuild). Roll back: set the old value and redeploy. Check after: the new bundle names the Cloud Run address and `cheruvugattu.online/sevas` lists the 27 sevas. Alternative the deploy doc offers: a custom domain such as `api.cheruvugattu.online` mapped to Cloud Run, which keeps the address stable; that is a DNS decision for the owner.
3. **(C) Meta WhatsApp webhook.** Where: Meta App Dashboard, WhatsApp, Configuration, Webhooks. Old: to be read by the owner (expected Render). New callback URL: `https://spjrsd-backend-zcjttwuqqa-el.a.run.app/api/whatsapp/webhook`; the verify token must equal `WHATSAPP_VERIFY_TOKEN` (stored in Secret Manager; the owner pastes it, I never handle it). Roll back: put the old URL back. Check after: send a message to the temple's WhatsApp number.
4. **(D) Cloud Build trigger** (so a merge to `main` deploys the backend). Where: Cloud Build in `sohum-509918`; repository `siddharthasharma9537/spjrsd`, branch `main`, included files `backend/**`, configuration `backend/cloudbuild.yaml`. Old: none. Roll back: delete the trigger. Not urgent; do after 1 to 3. Note: it makes merging backend changes deploy.
5. **Darshan gateway** `SPJRSD_BASE_URL`: already changed on 2026-10-25 (master document). Not re-checked.

Code changes after the cut-over (a pull request, no live effect): point the `.github/workflows` fallbacks and the sitemap script at the new address; fix `docs/deploy/CLOUD_RUN.md` and the README (Vercel, Render). Held until the owner has done 1 to 3.

## Next

1. Owner approves B (scheduled jobs), C (WhatsApp) and D (Cloud Build trigger). B is the most urgent: scheduled live-blog posts, blessings and the digest are still failing.
2. Upload the yearly panchangam (Vishvavasu 2025, Parabhava 2026, Plavanga 2027-28) from the engine to MongoDB: staging copy `spjrsd_staging.panchangam` first, dry run, then `--apply`, run by the owner (needs `MONGO_URL`). The earlier generated files were in a session scratchpad and no longer exist; regenerate with the engine (Panchangam repo, `integrations.temple_export`, now 2.6.0), which is Desk · Jyotisha's. Not verified: how many days of `panchangam` the live database holds (a read-only count settles it).
3. **Stotram texts**: the 12 entries exist with empty `text_telugu`; the Devasthanam supplies the wording (admin, Stotrams). Telugu liturgy is never AI-authored.

## Blocked

- **SMS OTP**: needs Jio DLT steps 2 to 5 (step 1, PE registration, was being done by the owner; its state is not known to this desk): (2) register sender ID `SPJRSD` under the PE, (3) register and get each OTP template approved, (4) PE-TM chain binding with MSG91 as telemarketer (MSG91 confirmation form, then approve the chain on the DLT portal), (5) enter the Entity/PE ID and sender ID in MSG91's "Add Sender ID Details". Until then e-mail OTP is the working path (`backend/.env.example`). Source: old session `local_1a91d509`.
- **Google Business Profile API approval**: syndication and review replies are inert without GBP credentials (`GBP_*` settings); approval status is not known to this desk. Source: old session `local_31f6ea5c`.
- **Panchangam cut-over inputs** (Next 2) are blocked on the owner running the upload.

## Waiting on the owner

1. Approve the live changes in Now (Actions variable, website build variable, WhatsApp webhook, Cloud Build trigger), and run the MongoDB upload (Next 2). The owner must also read the current WhatsApp webhook URL in the Meta dashboard.
2. **Seed endpoints**: closed. `POST /api/seed` needs the `X-Seed-Secret` header and refuses everyone while `SEED_SECRET` is unset, which it is on Cloud Run revision `00002` (checked by name only); `POST /api/seed/stotrams` needs the `stotrams:create` permission. Nothing to do unless the owner wants to seed a fresh database.
3. **Original panchangam source file** (for the 11 uncertain Vinayaka Chaturthi labels): probably moot. Since 2026-10-01 panchangam data is engine-only and the upload with `--overwrite` replaces every field of the dates it covers, including those labels. If the owner still has the file, say so; otherwise this item closes when the upload is done.
4. **Jio DLT steps 2 to 5** and **Google Business Profile API approval** (see Blocked): the owner's accounts.
5. **`ANTHROPIC_API_KEY`** for the website chat agent (`intent_router.py`; without it, intent classification falls back to menu replies). Possibly moot: the owner may prefer the Darshan/Vāni route. Decision needed: keep the chat agent (then set the key) or retire it.
6. **Cleanup proposals** (nothing done; each is the owner's call):
   - Remote branches already merged by squash, safe to delete: spjrsd `claude/google-review-replies`, `fix/review-reply-templates`, `fix/review-sync-paging`, `fix/review-sync-speed`, `fix/devotee-signin-and-ticket-lookup`, `samagri-api`, `claude/new-session-etjmny`, `feat/live-blog-pagination`, `claude/temple-digital-presence-naming-rlyugg`; darshan-gateway `get-seva-samagri`; darshan-web `cloud-run-darshan-store`, `link-temple-cards`. (Each has a merged PR: spjrsd #20 to #24, #31, #47, #48; darshan-gateway #2; darshan-web #2, #3.)
   - spjrsd `feat/panchangam-day-shape`: PR #19 closed unmerged, superseded by #33 and the engine-only decision; branch also exists locally. Delete after the owner agrees.
   - spjrsd `claude/website-mobile-app-conversion-4w4ybb` (Sept 5, 12 commits, no pull request, 224 files different from `main`): an Android/APK conversion that is far behind `main`. Keep as a reference, or delete; revive only as a fresh step if the owner wants an app.
   - Local `main` checkouts are behind `origin/main` (spjrsd 12 commits, darshan-gateway 1, darshan-web 3). They hold no local changes (only `.DS_Store` untracked), so a fast-forward is safe; not done here.
   - Old sessions that are fully captured here: see the report to HQ.
7. The README still says the frontend is on Vercel; it is on Render behind Cloudflare. A one-line docs fix, to be done when a step next touches the README.

## Open pull requests

- spjrsd: this ledger (`status/ledger`), awaiting review. No other open pull request in any of the three repositories.
- darshan-gateway: none. darshan-web: none.

## Live

Master document: `sohum-contracts` docs/SOHUM_SUITE_AND_CLOUD_CONSOLE.md, section 3.1, rows **Darshan** and **spjrsd** (read from there; this desk did not re-check live).

- **spjrsd frontend**: Render static site `cheruvugattu-web` behind Cloudflare (checked 2026-10-27 from response headers), calling the Cloud Run backend since change A on 2026-10-27. **Backend**: Cloud Run `spjrsd-backend` (`sohum-509918`, `asia-south1`, revision `00002`) since 2026-10-25; Render copy suspended. Cut-over unfinished (see Next 1). Database: MongoDB Atlas `sohum-cluster`, database `spjrsd`. Uploads: Cloudflare R2.
- **darshan-gateway**: Cloud Run since 2026-10-17, calls the spjrsd backend through `SPJRSD_BASE_URL`, changed to the Cloud Run address on 2026-10-25. Cloud Build deploys from `main`, so a merge there can deploy.
- **darshan-web**: Cloud Run `darshan-web`, landing page `darshan.sohum.cc`. Cloud Build deploys from `main`.
- Already on `main` (verified in code on 2026-10-27): the ticket-lookup data-leak fix and the Google sign-in fixes (#20); seed endpoint protection; Google review replies (#21 to #24); seva samagri API (#47) and the gateway's `get_seva_samagri` (#2).
