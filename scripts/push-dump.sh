#!/usr/bin/env bash
#
# Push the local SpaceNote dev environment to a production server.
# DESTRUCTIVE on the target: drops the remote Mongo database and replaces data/app/.
# Requires SPACENOTE_DATABASE_URL and SPACENOTE_DATA_DIR in the environment,
# passwordless sudo on the remote host (or root login),
# and `spacenote restore --yes` support on the remote (CLI v0.0.2+).
#
# Usage: scripts/push-dump.sh <host>
#
# Normally invoked via `just push-dump <host>` (which loads .env).
set -euo pipefail

# macOS BSD tar otherwise embeds AppleDouble files (._foo) and PAX xattr records
# (LIBARCHIVE.xattr.com.apple.provenance, etc.) that pollute the archive and
# produce noisy "Ignoring unknown extended header" warnings on the server's GNU tar.
# COPYFILE_DISABLE suppresses ._foo files; --no-xattrs (BSD tar / libarchive only,
# skipped on Linux GNU tar) suppresses the PAX xattr records.
export COPYFILE_DISABLE=1
TAR_FLAGS=""
if tar --no-xattrs --version >/dev/null 2>&1; then
    TAR_FLAGS="--no-xattrs"
fi

host="${1:?host required (e.g. root@notes.example.com)}"

: "${SPACENOTE_DATABASE_URL:?not set in environment}"
: "${SPACENOTE_DATA_DIR:?not set in environment}"

[[ -d "$SPACENOTE_DATA_DIR" ]] || { echo "Error: SPACENOTE_DATA_DIR does not exist: $SPACENOTE_DATA_DIR"; exit 1; }
command -v mongodump >/dev/null || { echo "Error: mongodump not found in PATH"; exit 1; }

# Parse the database name from the connection URL (the path segment after host[:port]/).
# Strips protocol+auth+host, then strips ?query if any.
remainder="${SPACENOTE_DATABASE_URL#*://}"
case "$remainder" in
    */*) db_part="${remainder#*/}"; local_db="${db_part%%\?*}" ;;
    *)   local_db="" ;;
esac
[[ -n "$local_db" ]] || { echo "Error: SPACENOTE_DATABASE_URL must include a database name (e.g. mongodb://localhost:27017/spacenote)"; exit 1; }

# The server's `spacenote restore` runs `mongorestore --db spacenote ...` (hardcoded).
# An archive made from a differently-named local DB would land in the wrong namespace.
[[ "$local_db" == "spacenote" ]] || { echo "Error: local DB name is '$local_db', but server restore expects 'spacenote'. Rename the local DB or use a different push tool."; exit 1; }

timestamp=$(date +%Y%m%d-%H%M%S)
remote_path="/tmp/spacenote-push-${timestamp}.tar.gz"

echo
echo "================================================================"
echo "  WARNING: ALL DATA ON THE TARGET SERVER WILL BE DESTROYED"
echo "================================================================"
echo
echo "  Target host:  $host"
echo "  Source:       $SPACENOTE_DATABASE_URL + $SPACENOTE_DATA_DIR"
echo
echo "  The following will be REPLACED on the target with local data:"
echo "    - MongoDB database 'spacenote' (--drop)"
echo "    - /opt/spacenote/data/app/ (attachments + images)"
echo
echo "  This cannot be undone. Type 'agree' to proceed:"
read -r answer
[[ "$answer" == "agree" ]] || { echo "Aborted."; exit 0; }

staging=$(mktemp -d)
# shellcheck disable=SC2064
trap "rm -rf '$staging'" EXIT

echo
echo "==> Dumping local MongoDB ($local_db)..."
mongodump --uri "$SPACENOTE_DATABASE_URL" --archive="$staging/db.archive.gz" --gzip

echo "==> Copying data dir (excluding backups/, logs/)..."
mkdir -p "$staging/app"
# Use rsync-style copy via tar to avoid cp's awkward handling of "everything except".
# This streams contents of $SPACENOTE_DATA_DIR into $staging/app/, skipping transient dirs.
# shellcheck disable=SC2086  # $TAR_FLAGS is intentionally word-split (single flag or empty)
tar $TAR_FLAGS -C "$SPACENOTE_DATA_DIR" --exclude=backups --exclude=logs -cf - . | tar $TAR_FLAGS -C "$staging/app" -xf -

cat > "$staging/manifest.txt" <<EOF
timestamp=${timestamp}
source_domain=local
cli_version=push-dump
db_name=spacenote
EOF

archive="$staging/spacenote-push-${timestamp}.tar.gz"
echo "==> Creating archive..."
# shellcheck disable=SC2086
tar $TAR_FLAGS -czf "$archive" -C "$staging" db.archive.gz app manifest.txt

size=$(du -h "$archive" | cut -f1)
echo "    $archive ($size)"

echo "==> Uploading to $host:$remote_path..."
scp "$archive" "$host:$remote_path"

echo "==> Restoring on $host..."
# shellcheck disable=SC2029  # $remote_path expands client-side intentionally
ssh "$host" "sudo spacenote restore --yes '$remote_path'"

echo "==> Cleaning up remote archive..."
# shellcheck disable=SC2029
ssh "$host" "sudo rm -f '$remote_path'"

echo
echo "Done. Verify at the target host's domain."
