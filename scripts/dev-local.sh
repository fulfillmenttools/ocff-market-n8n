#!/usr/bin/env bash
#
# Local development runner for this n8n community node package.
#
# Why this exists: the official `npm run dev` (`n8n-node dev`) launches n8n via
# `npx n8n@latest`, which currently pulls n8n 2.x — broken on recent Node
# versions (a @langchain/core dependency crash at startup). This script instead
# uses a globally-installed, Node-compatible `n8n` (install with
# `npm install -g n8n@1`) pointed at a dev user-folder, with the package linked
# into n8n's custom-extensions folder and TypeScript recompiled on change.
#
# Usage:
#   npm run dev:local              # link + build + watch + Cloudflare tunnel + n8n
#   npm run dev:local -- --no-tunnel   # same, but without the tunnel (action nodes only)
#
# The tunnel is on by default so the Trigger node can receive events. Stop with
# Ctrl+C — background watchers and the tunnel are cleaned up.

set -eo pipefail

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_DIR"

PKG_NAME="$(node -p "require('./package.json').name")"
N8N_USER_FOLDER="${N8N_USER_FOLDER:-$HOME/.n8n-node-cli}"
CUSTOM_DIR="$N8N_USER_FOLDER/.n8n/custom/node_modules"

USE_TUNNEL=true
for arg in "$@"; do
	[ "$arg" = "--no-tunnel" ] && USE_TUNNEL=false
done

# --- prerequisites -----------------------------------------------------------
if ! command -v n8n >/dev/null 2>&1; then
	echo "❌ n8n is not installed globally."
	echo "   Install a Node-compatible version:  npm install -g n8n@1"
	exit 1
fi

if lsof -iTCP:5678 -sTCP:LISTEN >/dev/null 2>&1; then
	echo "❌ Port 5678 is already in use (n8n already running?)."
	echo "   Stop it first:  pkill -f 'n8n start'"
	exit 1
fi

if [ ! -d node_modules ]; then
	echo "📦 Installing dependencies..."
	npm install
fi

# --- link the package into n8n's custom-extensions folder (idempotent) -------
mkdir -p "$CUSTOM_DIR"
# Remove any existing symlink that points to this project (handles package
# renames, e.g. unscoped -> scoped) so the node is never loaded twice.
find "$CUSTOM_DIR" -maxdepth 2 -type l 2>/dev/null | while read -r existing; do
	if [ "$(readlink "$existing")" = "$PROJECT_DIR" ]; then rm -f "$existing"; fi
done
LINK_PATH="$CUSTOM_DIR/$PKG_NAME"
mkdir -p "$(dirname "$LINK_PATH")"
ln -sfn "$PROJECT_DIR" "$LINK_PATH"
echo "🔗 Linked $PKG_NAME into $CUSTOM_DIR"

# --- initial build -----------------------------------------------------------
echo "🔨 Building..."
npm run build

# --- background watchers, cleaned up on exit ---------------------------------
PIDS=()
cleanup() {
	echo ""
	echo "🧹 Stopping..."
	for pid in "${PIDS[@]}"; do kill "$pid" 2>/dev/null || true; done
}
trap cleanup EXIT INT TERM

# Recompile TypeScript on change so n8n hot-reloads the node.
# Note: only .ts is watched; if you change an icon (.svg/.png), re-run the build.
npx tsc --watch --preserveWatchOutput >/dev/null 2>&1 &
PIDS+=("$!")
echo "👀 Watching TypeScript (hot reload enabled)"

# --- optional Cloudflare tunnel (needed for the Trigger / webhooks) ----------
WEBHOOK_URL=""
if [ "$USE_TUNNEL" = true ] && ! command -v cloudflared >/dev/null 2>&1; then
	echo "⚠️  cloudflared not installed — starting WITHOUT a tunnel."
	echo "    The Trigger node won't receive events. Install with: brew install cloudflared"
	USE_TUNNEL=false
fi
if [ "$USE_TUNNEL" = true ]; then
	CF_LOG="$(mktemp -t ft-cf-tunnel)"
	cloudflared tunnel --url http://localhost:5678 >"$CF_LOG" 2>&1 &
	PIDS+=("$!")
	printf "🌐 Starting Cloudflare tunnel"
	for _ in $(seq 1 30); do
		WEBHOOK_URL="$(grep -oE 'https://[a-z0-9-]+\.trycloudflare\.com' "$CF_LOG" | head -1 || true)"
		[ -n "$WEBHOOK_URL" ] && break
		printf "."
		sleep 1
	done
	printf "\n"
	if [ -z "$WEBHOOK_URL" ]; then
		echo "❌ Could not obtain a tunnel URL. See $CF_LOG"
		exit 1
	fi
	echo "🌐 Public URL: $WEBHOOK_URL"
	echo "   (Trigger callbacks register against this URL. It changes on each run —"
	echo "    re-activate trigger workflows after restarting.)"
fi

# --- start n8n (foreground) --------------------------------------------------
echo "🚀 Starting n8n at http://localhost:5678  (Ctrl+C to stop)"
echo ""
export N8N_USER_FOLDER N8N_DEV_RELOAD=true N8N_DIAGNOSTICS_ENABLED=false
if [ -n "$WEBHOOK_URL" ]; then
	export WEBHOOK_URL
fi
n8n start
