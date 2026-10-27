# Temple & Darshan status            updated 2026-10-27 by Desk · Temple & Darshan

Covers three repositories: `spjrsd` (this one, folder `spjrsd-src`; temple site `cheruvugattu.online`), `darshan-gateway` and `darshan-web`. `~/Workspace/spjrsd` is not a git repository; it holds posters, packages and outputs. How this ledger works: `sohum-contracts` docs/OPERATING_MODEL.md.

Checked on 2026-10-27 by reading git and GitHub only. Nothing was deployed, merged or written to a live system, and no live endpoint was called. "Not verified" below means exactly that.

## Now

- Setting up this ledger (this pull request). No build step is running.

## Next

1. **Finish the spjrsd backend cut-over to Cloud Run** (spjrsd#48 deployed it; cut-over is unfinished). Needs the owner's go-ahead for each live change:
   - Set the GitHub Actions variable `BACKEND_URL` to the Cloud Run address. `live-blog-publish.yml`, `panchangam-digest.yml` and `aashirvachanam-blessings.yml` all fall back to `https://spjrsd-backend.onrender.com` when the variable is unset, and Render suspended that service on 2026-10-24, so scheduled live-blog posts, the panchangam digest and the blessings are very likely not running. (Not verified: whether the variable is already set on GitHub.)
   - Point the website's own backend setting at Cloud Run.
   - Move the Meta WhatsApp webhook to Cloud Run.
   - Add a Cloud Build trigger (none exists; merging to `main` does not deploy the backend).
2. **Upload the yearly panchangam** (Vishvavasu 2025, Parabhava 2026, Plavanga 2027-28) from the engine to MongoDB: staging copy `spjrsd_staging.panchangam` first, dry run, then `--apply`, run by the owner (needs `MONGO_URL`). The earlier generated files were in a session scratchpad and no longer exist; regenerate with the engine (Panchangam repo, `integrations.temple_export`, now 2.6.0). Engine work belongs to Desk · Jyotisha; HQ to route. Not verified: how many days of `panchangam` the live database holds today (a read-only count settles it).
3. **Stotram texts**: the 12 entries exist with empty `text_telugu`; the Devasthanam supplies the wording (entered in admin → Stotrams). Nothing for Claude to write; Telugu liturgy is never AI-authored.

## Blocked

- **SMS OTP**: needs Jio DLT steps 2 to 5 (step 1, PE registration, was being done by the owner; its state is not known to this desk): (2) register sender ID `SPJRSD` under the PE, (3) register and get each OTP template approved, (4) PE-TM chain binding with MSG91 as telemarketer (MSG91 confirmation form, then approve the chain on the DLT portal), (5) enter the Entity/PE ID and sender ID in MSG91's "Add Sender ID Details". Until then e-mail OTP is the working path (`backend/.env.example`). Source: old session `local_1a91d509`.
- **Google Business Profile API approval**: syndication and review replies are inert without GBP credentials (`GBP_*` settings); approval status is not known to this desk. Source: old session `local_31f6ea5c`.
- **Panchangam cut-over inputs** (item 2 of Next) are blocked on the owner running the upload.

## Waiting on the owner

1. Run, or tell HQ to authorise, the live steps in Next 1 and 2 (Cloud Run address for the Actions variable, website setting, WhatsApp webhook; the MongoDB upload).
2. **Seed endpoints**: the code on `main` already protects both. `POST /api/seed` needs the `X-Seed-Secret` header (`SEED_SECRET`; refuses if unset), `POST /api/seed/stotrams` needs the `stotrams:create` permission. The older note "unauthenticated on production" is therefore a code fact only for the old Render build. Not verified: that Cloud Run revision `00002` has `SEED_SECRET` set. Owner can confirm in Secret Manager; no unauthenticated POST was made to check.
3. **Original panchangam source file** (for the 11 uncertain Vinayaka Chaturthi labels): probably moot. Since 2026-10-01 panchangam data is engine-only and the upload with `--overwrite` replaces every field of the dates it covers, including those labels. If the owner still has the file, say so; otherwise this item closes when the upload is done.
4. **Jio DLT steps 2 to 5** and **Google Business Profile API approval** (see Blocked): the owner's accounts.
5. **`ANTHROPIC_API_KEY`** for the website chat agent (`intent_router.py`; without it, intent classification falls back to menu replies). Possibly moot: the owner may prefer the Darshan/Vāni route. Decision needed: keep the chat agent (then set the key) or retire it.
6. **Cleanup proposals** (nothing done; each is the owner's call):
   - Remote branches already merged by squash, safe to delete: spjrsd `claude/google-review-replies`, `fix/review-reply-templates`, `fix/review-sync-paging`, `fix/review-sync-speed`, `fix/devotee-signin-and-ticket-lookup`, `samagri-api`, `claude/new-session-etjmny`, `feat/live-blog-pagination`, `claude/temple-digital-presence-naming-rlyugg`; darshan-gateway `get-seva-samagri`; darshan-web `cloud-run-darshan-store`, `link-temple-cards`. (Each has a merged PR: spjrsd #20 to #24, #31, #47, #48; darshan-gateway #2; darshan-web #2, #3.)
   - spjrsd `feat/panchangam-day-shape`: PR #19 closed unmerged, superseded by #33 and the engine-only decision; branch also exists locally. Delete after the owner agrees.
   - spjrsd `claude/website-mobile-app-conversion-4w4ybb` (Sept 5, 12 commits, no pull request, 224 files different from `main`): an Android/APK conversion that is far behind `main`. Keep as a reference, or delete; revive only as a fresh step if the owner wants an app.
   - Local `main` checkouts are behind `origin/main` (spjrsd 12 commits, darshan-gateway 1, darshan-web 3). They hold no local changes (only `.DS_Store` untracked), so a fast-forward is safe; not done here.
   - Old sessions that are fully captured here: see the report to HQ.
7. The README still says the frontend is on Vercel; it moved to Cloudflare (owner-reported 2026-10-14). A one-line docs fix, to be done when a step next touches the README.

## Open pull requests

- spjrsd: this ledger (`status/ledger`), awaiting review. No other open pull request in any of the three repositories.
- darshan-gateway: none. darshan-web: none.

## Live

Master document: `sohum-contracts` docs/SOHUM_SUITE_AND_CLOUD_CONSOLE.md, section 3.1, rows **Darshan** and **spjrsd** (read from there; this desk did not re-check live).

- **spjrsd frontend**: Cloudflare (owner-reported). **Backend**: Cloud Run `spjrsd-backend` (`sohum-509918`, `asia-south1`, revision `00002`) since 2026-10-25; Render copy suspended. Cut-over unfinished (see Next 1). Database: MongoDB Atlas `sohum-cluster`, database `spjrsd`. Uploads: Cloudflare R2.
- **darshan-gateway**: Cloud Run since 2026-10-17, calls the spjrsd backend through `SPJRSD_BASE_URL`, changed to the Cloud Run address on 2026-10-25. Cloud Build deploys from `main`, so a merge there can deploy.
- **darshan-web**: Cloud Run `darshan-web`, landing page `darshan.sohum.cc`. Cloud Build deploys from `main`.
- Already on `main` (verified in code on 2026-10-27): the ticket-lookup data-leak fix and the Google sign-in fixes (#20); seed endpoint protection; Google review replies (#21 to #24); seva samagri API (#47) and the gateway's `get_seva_samagri` (#2).
