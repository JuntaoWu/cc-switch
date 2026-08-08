#!/usr/bin/env bash
set -euo pipefail

TARGET_OWNER="JuntaoWu"
TARGET_REPO_NAME="cc-switch"
TARGET_RELEASES_URL="https://github.com/JuntaoWu/cc-switch/releases"
TARGET_LATEST_JSON_URL="https://github.com/JuntaoWu/cc-switch/releases/latest/download/latest.json"

EXPECTED_UPDATER_ENDPOINTS=(
  "$TARGET_LATEST_JSON_URL"
)

if ! grep -q '"pubkey"' src-tauri/tauri.conf.json; then
  echo "Missing updater public key in src-tauri/tauri.conf.json" >&2
  exit 1
fi

for endpoint in "${EXPECTED_UPDATER_ENDPOINTS[@]}"; do
  if ! grep -q "$endpoint" src-tauri/tauri.conf.json; then
    echo "Expected updater endpoint missing: $endpoint" >&2
    exit 1
  fi
done

if grep -q 'https://github.com/farion1231/cc-switch/releases/latest/download/latest.json' src-tauri/tauri.conf.json; then
  echo "Upstream release endpoint still present" >&2
  exit 1
fi

if grep -q 'https://dl.ccswitch.io/latest.json' src-tauri/tauri.conf.json; then
  echo "The old upstream updater endpoint is still present" >&2
  exit 1
fi

if grep -q 'https://github.com/farion1231/cc-switch/releases/latest' src-tauri/src/commands/misc.rs; then
  echo "Manual update URL still points to the upstream release page" >&2
  exit 1
fi

printf 'Release channel guard passed for %s/%s\n' "$TARGET_OWNER" "$TARGET_REPO_NAME"
