#!/usr/bin/env bash
#
# Pull a fresh dump from a SpaceNote production server.
# Runs `spacenote dump` remotely and downloads the archive to <dest>/.
# Aborts if <dest> exists and is not empty.
# Requires passwordless sudo on the remote host (or root login).
#
# Usage: scripts/pull-dump.sh <host> <dest>
#
# Normally invoked via `just pull-dump <host> [dest]`.
set -euo pipefail

host="${1:?host required (e.g. root@notes.example.com)}"
dest="${2:?dest directory required}"

if [[ -d "$dest" ]] && [[ -n "$(ls -A "$dest" 2>/dev/null)" ]]; then
    echo "Error: $dest already exists and is not empty."
    echo "Inspect or remove it manually before running pull-dump again."
    exit 1
fi

echo "==> Creating dump on $host..."
ssh "$host" "sudo spacenote dump"

echo "==> Locating latest archive..."
remote=$(ssh "$host" "sudo sh -c 'ls -t /opt/spacenote/backups/*.tar.gz | head -1'")
[[ -n "$remote" ]] || { echo "Error: no archive found on remote"; exit 1; }
echo "    $remote"

mkdir -p "$dest"
local_path="$dest/$(basename "$remote")"

echo "==> Downloading to $local_path..."
# $remote was obtained from the previous ssh call — expand it client-side intentionally.
# shellcheck disable=SC2029
ssh "$host" "sudo cat '$remote'" > "$local_path"

size=$(du -h "$local_path" | cut -f1)
echo
echo "Done: $local_path ($size)"
