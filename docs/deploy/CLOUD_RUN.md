# Moving the spjrsd backend from Render to Google Cloud Run

**Prepared, not deployed.** Nothing here has been run against Google Cloud. The Render service
`spjrsd-backend` was **suspended on 2026-10-24** ("Free Tier Usage Exceeded"), so every temple question in the
SoHum chat that reads sevas failed (the Darshan gateway got `502` from `GET /v1/temples/spjrsd/sevas`). Cloud Run
is where Darshan, Store and the assistant already run. Each step that changes the cloud project, the database
access list, DNS or a live setting happens only on the owner's instruction.

| Setting | Value |
|---|---|
| Project | `sohum-509918` |
| Region | `asia-south1` (Mumbai) |
| Service | `spjrsd-backend` |
| Container | [`backend/Dockerfile`](../../backend/Dockerfile): Python 3.12, `uvicorn app.main:app` on `$PORT` (8080) |
| Build and deploy | [`backend/cloudbuild.yaml`](../../backend/cloudbuild.yaml), run by a Cloud Build trigger |
| Scaling | minimum 0 (scales to zero), **maximum 2**, 1 vCPU, 1 GiB, request timeout 300 s |
| Access | public (`--allow-unauthenticated`): the app checks its own JWTs, HMAC and cron secret |
| Data | unchanged: MongoDB Atlas (`sohum-cluster`, database `spjrsd`) and Cloudflare R2. **No data moves.** |

## What was checked, and what was not

- Checked: the backend has **no in-process scheduler and no local file writes**. Its three scheduled jobs are GitHub
  Actions calling `/api/cron/...`, so scaling to zero is safe. All uploads go to R2.
- Checked: the requirements install and `uvicorn app.main:app` starts from `backend/` (on Python 3.13, not the 3.12 of
  the image; the image itself was **not built**, there was no running Docker daemon).
- Checked: **startup needs MongoDB reachable.** `app.main` seeds the built-in roles on boot, so if Atlas refuses the
  connection the container fails to start and the revision never becomes ready.
- Not checked: any request against a real database, the 1 GiB memory size (pandas and numpy are imported), the cold
  start time, and whether Render used a Python version other than 3.12.

## Before the first deploy (owner)

1. **Atlas network access.** Cloud Run has no fixed outgoing address. In Atlas, Network Access must allow it
   (the usual setting is `0.0.0.0/0`, protected by the database user's password; Render needed the same, because its
   addresses also change). A fixed address needs a VPC connector and Cloud NAT, which is more setup and a monthly cost.
2. **Secrets.** Create one Secret Manager secret per sensitive value, copying the current value from the Render
   service's environment page. Nothing goes in the repository, the chat or a build log.
3. APIs: `run`, `artifactregistry` and `cloudbuild` are already enabled in `sohum-509918` (other services use them).

## Environment values

Render's environment for `spjrsd-backend` has **28 keys**, all in the lists below (checked against the names the code
reads). Names only here; values never go in the repository, a chat or a build log. Set once on the service; later
deploys by Cloud Build **keep them**.

| Kind | Names |
|---|---|
| Secrets (14, stored in Secret Manager) | `MONGO_URL`, `JWT_SECRET`, `CRON_SECRET`, `GATEWAY_SERVICE_SECRET`, `MSG91_AUTH_KEY`, `WHATSAPP_TOKEN`, `WHATSAPP_VERIFY_TOKEN`, `META_APP_SECRET`, `GEMINI_API_KEY`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `FB_PAGE_TOKEN`, `GBP_CLIENT_SECRET`, `GBP_REFRESH_TOKEN` |
| Plain values (14) | `DB_NAME`, `CHAT_AGENT_MODEL`, `GOOGLE_CLIENT_ID`, `MSG91_EMAIL_DOMAIN`, `MSG91_EMAIL_FROM`, `WHATSAPP_PHONE_NUMBER_ID`, `R2_ACCOUNT_ID`, `R2_BUCKET_NAME`, `R2_PUBLIC_URL`, `FB_PAGE_ID`, `IG_USER_ID`, `GBP_ACCOUNT_ID`, `GBP_LOCATION_ID`, `GBP_CLIENT_ID` |
| Optional, not on Render today (code defaults apply) | `SEED_SECRET`, `ANTHROPIC_API_KEY` (without it the intent router falls back to a keyword check), `INTENT_ROUTER_MODEL`, `MSG91_EMAIL_TEMPLATE_SLUG`, `WHATSAPP_OTP_TEMPLATE_NAME`, `TASK_ALERT_EMAIL`, `SITE_URL`, `FB_GRAPH_VERSION` |
| Leave unset in production | `CORS_EXTRA_ORIGINS` (local development only) |

`GATEWAY_SERVICE_SECRET` must be **the same value** the Darshan gateway signs with.

### Copying them without typing or pasting a value

1. Render: the service, Environment, **Edit as .env**. Copy it into a local file `render.env` (git ignores it).
2. Sign in to `gcloud` (Cloud Shell works) and run the helper. The first run is a **dry run**:

   ```bash
   python3 ops/cloud-run/render_env_to_cloud_run.py render.env           # shows what it would do
   python3 ops/cloud-run/render_env_to_cloud_run.py render.env --apply   # creates the 14 secrets
   ```

   It prints no value, sends each secret to `gcloud` on stdin, writes the plain settings to `env.cloudrun.yaml`, and
   prints the exact `gcloud run deploy` command for the next section. A key it does not know stops it (add the key to
   the script's lists on purpose). Delete `render.env` and `env.cloudrun.yaml` afterwards.
3. If the deploy says a secret is **permission denied**, give the Cloud Run service account access:

   ```bash
   gcloud projects add-iam-policy-binding sohum-509918 \
     --member=serviceAccount:1007417351252-compute@developer.gserviceaccount.com --role=roles/secretmanager.secretAccessor
   ```

   (`1007417351252` is the project number in the other Cloud Run addresses; check it under the project's settings.)

## First deploy (on the owner's instruction)

From the repository root, once the secrets exist, run the command the helper printed. It looks like this
(the `--set-secrets` list has all 14 secrets):

```bash
gcloud run deploy spjrsd-backend --source backend --project sohum-509918 --region asia-south1 \
  --min-instances 0 --max-instances 2 --cpu 1 --memory 1Gi --cpu-boost --timeout 300 --allow-unauthenticated \
  --env-vars-file env.cloudrun.yaml \
  --set-secrets MONGO_URL=spjrsd-mongo-url:latest,JWT_SECRET=spjrsd-jwt-secret:latest,...
```

Then create the Cloud Build trigger: repository
`siddharthasharma9537/spjrsd`, branch `main`, included files `backend/**`, configuration `backend/cloudbuild.yaml`.

## Check before anything points at it

1. `GET <new address>/api/health` answers (it also reports which optional services are configured).
2. `GET <new address>/api/sevas` returns the temple's sevas (the same data the website shows).
3. Read the Cloud Run logs for the revision: no startup traceback.

## Cut over, in this order (owner)

The old Render service is suspended, so it is **not** a live fallback; rolling back means pointing these back at
Render once it is upgraded.

1. **Darshan gateway.** Change the variable that holds `spjrsd-backend.onrender.com` on the `darshan-gateway` Cloud
   Run service to the new address. Then ask the SoHum chat a temple question ("grihapravesham samagri"): it should
   answer, or say "couldn't find a seva called…", not show an error.
2. **Website.** Set the frontend's `REACT_APP_BACKEND_URL` (the build variable on Cloudflare) to the new address, or
   re-point `api.cheruvugattu.online` if that is the address in use. DNS or a domain mapping is the owner's decision.
3. **Scheduled jobs.** In GitHub, Settings, Secrets and variables, Actions, Variables, add `BACKEND_URL` with the new
   address. The three workflows use it and fall back to the Render address until it is set. Run each once from the
   Actions tab ("Run workflow") and check it succeeds. `CRON_SECRET` must match the one set on the service.
4. **WhatsApp.** In the Meta App Dashboard, WhatsApp, Configuration, Webhooks, change the callback URL to
   `<new address>/api/whatsapp/webhook` and confirm the verify token still matches
   `WHATSAPP_VERIFY_TOKEN`.
5. **Google sign-in, MSG91 and R2** need no change: they do not depend on the backend's address.

## After the move

- Measure the first request after 20 idle minutes (cold start) and, if it is slow, consider `--min-instances 1`
  (a small always-on cost).
- Look at the memory graph; lower `--memory` if it stays well under 1 GiB.
- Update the status table in `sohum-contracts` (`SOHUM_SUITE_AND_CLOUD_CONSOLE.md`): the spjrsd row, and the
  Darshan row's note that temple calls go to Render.
