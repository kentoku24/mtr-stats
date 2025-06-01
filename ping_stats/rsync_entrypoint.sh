#!/bin/sh
set -eu

: "${RSYNC_TARGET:?RSYNC_TARGET is required}"
RSYNC_OPTIONS="${RSYNC_OPTIONS:--avz --delete}"
RSYNC_SSH_KEY_PATH="${RSYNC_SSH_KEY_PATH:-/app/id_ed25519}"
SYNC_INTERVAL="${SYNC_INTERVAL:-60}"


while true; do
  echo "[INFO] $(date -u +'%Y-%m-%dT%H:%M:%SZ') rsync start"
  RSYNC_RSH="ssh -i $RSYNC_SSH_KEY_PATH -o StrictHostKeyChecking=no -o IdentitiesOnly=yes"
  rsync $RSYNC_OPTIONS -e "$RSYNC_RSH" /app/logs/ "$RSYNC_TARGET"
  echo "[INFO] $(date -u +'%Y-%m-%dT%H:%M:%SZ') rsync end"
  sleep "$SYNC_INTERVAL"
done
