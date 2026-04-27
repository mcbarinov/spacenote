#!/usr/bin/env bash
#
# Restore the local dev environment from a dump archive created by `spacenote dump`.
# DESTRUCTIVE: drops the local Mongo database and replaces $SPACENOTE_DATA_DIR.
# Requires SPACENOTE_DATABASE_URL and SPACENOTE_DATA_DIR in the environment.
# Stop the backend before running.
#
# Usage: scripts/restore-from-dump.sh <archive-path>
#
# Normally invoked via `just restore-from-dump <archive-path>` (which loads .env).
set -euo pipefail

path="${1:?archive path required}"
[[ -f "$path" ]] || { echo "Error: archive not found: $path"; exit 1; }

: "${SPACENOTE_DATABASE_URL:?not set in environment}"
: "${SPACENOTE_DATA_DIR:?not set in environment}"

# Parse the database name from the connection URL (the path segment after host[:port]/).
# Strips protocol+auth+host, then strips ?query if any. Empty if URL has no /db part.
remainder="${SPACENOTE_DATABASE_URL#*://}"
case "$remainder" in
    */*) db_part="${remainder#*/}"; local_db="${db_part%%\?*}" ;;
    *)   local_db="" ;;
esac
[[ -n "$local_db" ]] || { echo "Error: SPACENOTE_DATABASE_URL must include a database name (e.g. mongodb://localhost:27017/spacenote)"; exit 1; }

staging=$(mktemp -d)
# shellcheck disable=SC2064
trap "rm -rf '$staging'" EXIT

# Read manifest first so the warning prompt can show source server and db name.
if ! tar -xzf "$path" -C "$staging" ./manifest.txt 2>/dev/null \
    && ! tar -xzf "$path" -C "$staging" manifest.txt 2>/dev/null; then
    echo "Error: invalid archive — manifest.txt not found"
    exit 1
fi
source_domain=$(grep "^source_domain=" "$staging/manifest.txt" | cut -d'=' -f2-)
# db_name is present in archives produced by spacenote.sh ≥ the version that added it;
# fall back to "spacenote" for older archives (the only db name dump ever used).
source_db=$(grep "^db_name=" "$staging/manifest.txt" 2>/dev/null | cut -d'=' -f2- || true)
[[ -z "$source_db" ]] && source_db="spacenote"

echo
echo "================================================================"
echo "  WARNING: ALL LOCAL DATA WILL BE PERMANENTLY DESTROYED"
echo "================================================================"
echo
echo "  Archive:        $path"
echo "  Source domain:  $source_domain"
echo
echo "  The following will be REPLACED with data from the archive:"
echo "    - Mongo URL:   $SPACENOTE_DATABASE_URL"
echo "    - DB restore:  ${source_db}.* → ${local_db}.*"
echo "    - Data dir:    $SPACENOTE_DATA_DIR"
echo
echo "  This cannot be undone. Type 'agree' to proceed:"
read -r answer
[[ "$answer" == "agree" ]] || { echo "Aborted."; exit 0; }

echo
echo "==> Extracting archive..."
tar -xzf "$path" -C "$staging"

echo "==> Restoring database (${source_db}.* → ${local_db}.*)..."
mongorestore --uri "$SPACENOTE_DATABASE_URL" --drop \
    --nsFrom="${source_db}.*" --nsTo="${local_db}.*" \
    --archive="$staging/db.archive.gz" --gzip

echo "==> Replacing data dir..."
rm -rf "$SPACENOTE_DATA_DIR"
mv "$staging/app" "$SPACENOTE_DATA_DIR"

echo
echo "Done. Restart the backend to refresh in-memory caches."
