#!/usr/bin/env bash
# Checks, builds and uploads Code On Screen to a VPS over SSH.
#
# Usage:  DEPLOY_HOST=deploy@codeonscreen.example.com npm run deploy:vps
# Optional: DEPLOY_PATH (default /var/www/code-on-screen)
#
# Requires rsync locally and on the server, and SSH key login for DEPLOY_HOST.

# Stop at the first failing command, on unset variables, and inside pipes.
set -euo pipefail

: "${DEPLOY_HOST:?Set DEPLOY_HOST, e.g. DEPLOY_HOST=deploy@codeonscreen.example.com}"
DEPLOY_PATH="${DEPLOY_PATH:-/var/www/code-on-screen}"

echo "→ Checking (typecheck, lint, format, tests)"
npm run check

echo "→ Building"
npm run build

echo "→ Uploading to $DEPLOY_HOST:$DEPLOY_PATH"
# The trailing slash on dist/ copies its contents, not the folder itself.
# --delete removes files that no longer exist locally (old hashed assets).
rsync -avz --delete dist/ "$DEPLOY_HOST:$DEPLOY_PATH/"

echo "✓ Deployed"
