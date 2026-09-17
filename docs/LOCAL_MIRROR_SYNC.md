# Local Mirror Sync — Temple Office Dashboard

Spec for the on-prem "hybrid" setup discussed under Project Setu: a small
machine in the temple office that holds a **read-only, periodically-refreshed
copy** of the production database, plus a local build of the admin dashboard
pointed at that copy. It never takes public traffic and never writes back to
the cloud — its only job is to let staff view bookings, donations and
devotee records on the office LAN even when the internet is down or slow.

## Architecture

```
   Cloud (source of truth)                  Temple office (mirror)
  ┌─────────────────────────┐   nightly    ┌──────────────────────────┐
  │ MongoDB (Atlas / DO)     │ ───────────► │ Local MongoDB            │
  │  - all writes land here  │  mongodump   │  - read-only copy        │
  └─────────────────────────┘   /restore    └──────────────────────────┘
                                                       │
                                                       ▼
                                             ┌──────────────────────────┐
                                             │ Local admin dashboard    │
                                             │ (same React/FastAPI code,│
                                             │  LOCAL_MIRROR=true)      │
                                             └──────────────────────────┘
                                                       │
                                              LAN only, or via a
                                              WireGuard/Tailscale
                                              VPN for remote staff access
```

One direction only: cloud → local. The local copy is disposable — if it's
ever wrong or corrupted, the fix is to re-sync, never to "reconcile" it by
hand.

## 1. Sync mechanism

A scheduled job on the local machine pulls a fresh dump from the cloud
database and restores it into the local one, replacing the previous copy
wholesale rather than trying to merge changes.

**`ops/local-mirror/sync.sh`** (installed as a cron job):

```bash
#!/usr/bin/env bash
set -euo pipefail

# Required env vars (see .env.example):
#   CLOUD_MONGO_URI   - read-only connection string to the production DB
#   LOCAL_MONGO_URI   - connection string for the local mirror (default: localhost)
#   BACKUP_DIR        - where dump snapshots are kept
#   RETENTION_DAYS    - how many days of snapshots to keep
#   ALERT_WHATSAPP_TO - phone number to notify on failure (optional)

source "$(dirname "$0")/.env"

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DUMP_PATH="${BACKUP_DIR}/${TIMESTAMP}"

log() { echo "[$(date -Iseconds)] $*"; }

cleanup_old_snapshots() {
  find "${BACKUP_DIR}" -maxdepth 1 -type d -mtime "+${RETENTION_DAYS}" -exec rm -rf {} +
}

on_failure() {
  log "SYNC FAILED"
  if [[ -n "${ALERT_WHATSAPP_TO:-}" ]]; then
    # Reuses the same WhatsApp Cloud API credentials as the devotee-facing bot
    # (WHATSAPP_TOKEN / WHATSAPP_PHONE_NUMBER_ID) - see backend/.env.example.
    curl -s -X POST "https://graph.facebook.com/v21.0/${WHATSAPP_PHONE_NUMBER_ID}/messages" \
      -H "Authorization: Bearer ${WHATSAPP_TOKEN}" \
      -H "Content-Type: application/json" \
      -d "{\"messaging_product\":\"whatsapp\",\"to\":\"${ALERT_WHATSAPP_TO}\",\"type\":\"text\",\"text\":{\"body\":\"Local mirror sync failed at $(date). Check the office machine.\"}}" \
      || true
  fi
  exit 1
}
trap on_failure ERR

log "Starting dump from cloud"
mongodump --uri="${CLOUD_MONGO_URI}" --readPreference=secondaryPreferred --out="${DUMP_PATH}"

log "Restoring into local mirror"
mongorestore --drop --uri="${LOCAL_MONGO_URI}" "${DUMP_PATH}"

log "Sync succeeded"
cleanup_old_snapshots
```

**Cron entry** (every 6 hours; adjust to taste — there's no need for this to
be more frequent than staff actually check the dashboard):

```
0 */6 * * * /opt/spjrsd-mirror/sync.sh >> /var/log/spjrsd-mirror.log 2>&1
```

## 2. Cloud-side setup

- Create a **dedicated, read-only** database user in Atlas/DO (e.g.
  `spjrsd_mirror_readonly`) scoped to the `readAnly` role on the production
  database only. Never reuse the backend's own read-write credentials here —
  if the office machine is ever compromised, a read-only user limits the
  blast radius to "someone saw the data," not "someone changed it."
- Add the temple office's IP to the cluster's IP access list, or — better,
  since rural IPs are rarely static — route the sync job over a **WireGuard
  or Tailscale** tunnel and allowlist that tunnel's fixed address instead.

## 3. Local dashboard

Reuse the existing frontend/backend code rather than building a second app:

- Run the FastAPI backend locally with `MONGO_URL` pointed at the local
  mirror instead of the cloud cluster.
- Add a `LOCAL_MIRROR=true` environment flag that the backend checks to
  **reject all write requests** (bookings, donations, admin edits) with a
  clear "read-only mirror — use the live site" error, instead of silently
  accepting writes that would vanish on the next sync.
- Run the existing React admin build (`frontend`, routes under `/admin/*`)
  pointed at that local backend (`REACT_APP_BACKEND_URL=http://<local-ip>:8000`).
- Serve it on the office LAN only (bind to the LAN interface, not `0.0.0.0`
  on a router with port-forwarding) — no public exposure, no SSL cert
  needed for LAN-only HTTP, though a self-signed cert or Tailscale's own
  HTTPS is fine if staff want it in the browser bar.

## 4. Monitoring

- Every sync run logs to `/var/log/spjrsd-mirror.log` with a timestamp.
- On failure, the script sends a WhatsApp alert (via the temple's existing
  Meta Cloud API credentials) to whoever's phone number is configured —
  reuses infrastructure that already exists rather than adding a new
  alerting tool.
- A simple weekly sanity check: compare `db.bookings.countDocuments()`
  between cloud and local — if they diverge by more than the last sync
  interval's worth of activity, something's wrong with the job, not the data.

## 5. What this deliberately does NOT do

- **No write-back.** Any reconciliation or correction happens on the live
  site, which stays the single source of truth. This mirror exists so staff
  can *look things up* offline, not to *change* records offline.
- **No public exposure.** No port-forwarding, no public DNS entry. Remote
  access (if a staff member needs it from home) goes through a VPN, never
  through opening a port on the temple's router.
- **No dependency for the live site.** The public website, bookings, and
  payments never read from or depend on this mirror in any way — it's a
  convenience for the office, not part of the production path.

## Files

```
ops/local-mirror/
├── sync.sh          # the cron job itself
├── .env.example     # required variables, see below
└── README.md        # one-page setup instructions for whoever installs it
```
