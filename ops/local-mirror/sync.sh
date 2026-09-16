#!/usr/bin/env bash
set -euo pipefail

# Pulls a fresh dump of the production MongoDB database and restores it into
# a local, read-only mirror. Cloud -> local, one direction only - see
# docs/LOCAL_MIRROR_SYNC.md for the full design and why it deliberately
# never writes back.
#
# Install as a cron job, e.g. every 6 hours:
#   0 */6 * * * /opt/spjrsd-mirror/sync.sh >> /var/log/spjrsd-mirror.log 2>&1

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=.env
source "${SCRIPT_DIR}/.env"

: "${CLOUD_MONGO_URI:?Set CLOUD_MONGO_URI in .env}"
: "${LOCAL_MONGO_URI:?Set LOCAL_MONGO_URI in .env}"
: "${BACKUP_DIR:?Set BACKUP_DIR in .env}"
: "${RETENTION_DAYS:=14}"

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DUMP_PATH="${BACKUP_DIR}/${TIMESTAMP}"

log() { echo "[$(date -Iseconds)] $*"; }

cleanup_old_snapshots() {
  find "${BACKUP_DIR}" -mindepth 1 -maxdepth 1 -type d -mtime "+${RETENTION_DAYS}" -exec rm -rf {} +
}

send_failure_alert() {
  if [[ -n "${ALERT_WHATSAPP_TO:-}" && -n "${WHATSAPP_TOKEN:-}" && -n "${WHATSAPP_PHONE_NUMBER_ID:-}" ]]; then
    curl -s -X POST "https://graph.facebook.com/v21.0/${WHATSAPP_PHONE_NUMBER_ID}/messages" \
      -H "Authorization: Bearer ${WHATSAPP_TOKEN}" \
      -H "Content-Type: application/json" \
      -d "{\"messaging_product\":\"whatsapp\",\"to\":\"${ALERT_WHATSAPP_TO}\",\"type\":\"text\",\"text\":{\"body\":\"Local mirror sync failed at $(date). Check the office machine.\"}}" \
      || log "Alert send itself failed - continuing"
  fi
}

on_failure() {
  log "SYNC FAILED"
  send_failure_alert
  exit 1
}
trap on_failure ERR

log "Starting dump from cloud database"
mongodump --uri="${CLOUD_MONGO_URI}" --readPreference=secondaryPreferred --out="${DUMP_PATH}"

log "Restoring into local mirror (dropping previous collections)"
mongorestore --drop --uri="${LOCAL_MONGO_URI}" "${DUMP_PATH}"

log "Sync succeeded"
cleanup_old_snapshots
