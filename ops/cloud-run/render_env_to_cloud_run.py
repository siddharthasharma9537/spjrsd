#!/usr/bin/env python3
"""Copies the spjrsd backend's settings from a Render .env file to Google Cloud Run.

Render: the service, Environment, "Edit as .env" (copy it into a local file, e.g. render.env). Then:

    python3 ops/cloud-run/render_env_to_cloud_run.py render.env            # dry run: shows what it would do
    python3 ops/cloud-run/render_env_to_cloud_run.py render.env --apply    # creates the secrets

The sensitive keys become Secret Manager secrets named spjrsd-<key>, with the value sent to gcloud on stdin.
The rest are written to env.cloudrun.yaml. **No value is ever printed.** Keep the .env file and the YAML out of
git (they are ignored) and delete them when done. It prints the `gcloud run deploy` command to run next.
Nothing in the cloud changes without --apply, and --apply only creates or updates secrets (it never deploys).
"""
import argparse
import json
import subprocess
import sys

SECRET_KEYS = [
    "MONGO_URL", "JWT_SECRET", "CRON_SECRET", "SEED_SECRET", "GATEWAY_SERVICE_SECRET",
    "MSG91_AUTH_KEY", "WHATSAPP_TOKEN", "WHATSAPP_VERIFY_TOKEN", "META_APP_SECRET",
    "GEMINI_API_KEY", "ANTHROPIC_API_KEY", "R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY",
    "FB_PAGE_TOKEN", "GBP_CLIENT_SECRET", "GBP_REFRESH_TOKEN",
]
PLAIN_KEYS = [
    "DB_NAME", "CHAT_AGENT_MODEL", "INTENT_ROUTER_MODEL", "GOOGLE_CLIENT_ID",
    "MSG91_EMAIL_DOMAIN", "MSG91_EMAIL_FROM", "MSG91_EMAIL_TEMPLATE_SLUG",
    "WHATSAPP_PHONE_NUMBER_ID", "WHATSAPP_OTP_TEMPLATE_NAME", "TASK_ALERT_EMAIL", "SITE_URL",
    "R2_ACCOUNT_ID", "R2_BUCKET_NAME", "R2_PUBLIC_URL",
    "FB_PAGE_ID", "FB_GRAPH_VERSION", "IG_USER_ID", "GBP_ACCOUNT_ID", "GBP_LOCATION_ID", "GBP_CLIENT_ID",
]
REQUIRED = ["MONGO_URL", "DB_NAME", "JWT_SECRET"]


def parse_env(path: str) -> dict[str, str]:
    values = {}
    for line in open(path, encoding="utf-8"):
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, value = line.removeprefix("export ").partition("=")
        value = value.strip()
        if len(value) >= 2 and value[0] == value[-1] and value[0] in "\"'":
            value = value[1:-1]
        values[key.strip()] = value
    return values


def secret_name(key: str) -> str:
    return "spjrsd-" + key.lower().replace("_", "-")


def gcloud(args: list[str], stdin: str | None = None) -> subprocess.CompletedProcess:
    return subprocess.run(["gcloud", *args], input=stdin, text=True, capture_output=True)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("env_file")
    parser.add_argument("--project", default="sohum-509918")
    parser.add_argument("--region", default="asia-south1")
    parser.add_argument("--service", default="spjrsd-backend")
    parser.add_argument("--apply", action="store_true", help="create or update the Secret Manager secrets")
    parser.add_argument("--yaml", default="env.cloudrun.yaml", help="where to write the plain settings")
    args = parser.parse_args()

    values = parse_env(args.env_file)
    unknown = sorted(set(values) - set(SECRET_KEYS) - set(PLAIN_KEYS))
    if unknown:
        print("Unknown keys (not copied; add each to SECRET_KEYS or PLAIN_KEYS in this script first):", ", ".join(unknown))
        return 2
    missing = [k for k in REQUIRED if not values.get(k)]
    if missing:
        print("Missing required keys:", ", ".join(missing))
        return 2

    secrets = [k for k in SECRET_KEYS if values.get(k)]
    plain = {k: values[k] for k in PLAIN_KEYS if values.get(k)}
    print(f"{len(secrets)} secrets, {len(plain)} plain settings, {len(values) - len(secrets) - len(plain)} empty keys skipped.")
    for key in secrets:
        print(f"  secret  {secret_name(key):38} <- {key}")
    for key in plain:
        print(f"  plain   {key}")

    if args.apply:
        for key in secrets:
            name = secret_name(key)
            exists = gcloud(["secrets", "describe", name, "--project", args.project]).returncode == 0
            command = ["secrets", "versions", "add", name] if exists else ["secrets", "create", name, "--replication-policy=automatic"]
            result = gcloud([*command, "--data-file=-", "--project", args.project], stdin=values[key])
            if result.returncode:
                print(f"FAILED {name}: {result.stderr.strip().splitlines()[-1] if result.stderr.strip() else 'gcloud error'}")
                return 1
            print(f"  {'updated' if exists else 'created'} {name}")
    else:
        print("\nDry run: nothing was created. Add --apply to create the secrets.")

    with open(args.yaml, "w", encoding="utf-8") as out:
        for key, value in plain.items():
            out.write(f"{key}: {json.dumps(value)}\n")
    print(f"\nWrote the plain settings to {args.yaml} (git ignores it; delete it when done).")
    pairs = ",".join(f"{k}={secret_name(k)}:latest" for k in secrets)
    print("\nNext, from the repository root, to deploy (only on your instruction):\n")
    print(f"gcloud run deploy {args.service} --source backend --project {args.project} --region {args.region} \\\n"
          f"  --min-instances 0 --max-instances 2 --cpu 1 --memory 1Gi --cpu-boost --timeout 300 --allow-unauthenticated \\\n"
          f"  --env-vars-file {args.yaml} \\\n  --set-secrets {pairs}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
