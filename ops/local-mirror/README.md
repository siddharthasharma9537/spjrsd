# Local Mirror Sync

See [`docs/LOCAL_MIRROR_SYNC.md`](../../docs/LOCAL_MIRROR_SYNC.md) for the full design and rationale.

## Setup on the office machine

1. Install MongoDB Database Tools (`mongodump`/`mongorestore`) and a local MongoDB server.
2. Copy this directory to `/opt/spjrsd-mirror/` (or wherever you prefer) on the office machine.
3. Copy `.env.example` to `.env` and fill in `CLOUD_MONGO_URI` with a **read-only** database user's connection string.
4. Make the script executable: `chmod +x sync.sh`
5. Run it once by hand to confirm it works: `./sync.sh`
6. Install the cron job:
   ```
   0 */6 * * * /opt/spjrsd-mirror/sync.sh >> /var/log/spjrsd-mirror.log 2>&1
   ```
7. Point a local build of the backend (`MONGO_URL` = the value of `LOCAL_MONGO_URI`, plus `LOCAL_MIRROR=true`) and the admin frontend at this machine, bound to the office LAN only.

## Checking it's working

```
tail -f /var/log/spjrsd-mirror.log
```

A healthy run ends with `Sync succeeded`. A failure sends a WhatsApp alert (if configured) and stops the cron job's exit code non-zero, which most cron setups will also surface via system mail if you have that configured.
