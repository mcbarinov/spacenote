#!/usr/bin/env bash
#
# spacenote — server management CLI for SpaceNote
#
# Install on a fresh server:
#   curl -fsSL https://raw.githubusercontent.com/mcbarinov/spacenote/main/deploy/spacenote.sh | sudo bash
#   spacenote install
#
# Manages a Docker Compose stack:
#   Caddy (reverse proxy + auto-SSL) → Backend (FastAPI) + Frontend (React) → MongoDB
#   Images are pulled from GHCR (ghcr.io/mcbarinov/spacenote-*)
#
# Directory layout on the server:
#   /opt/spacenote/
#   ├── docker-compose.yml   — service definitions (downloaded from GitHub)
#   ├── .env                 — configuration (generated during install)
#   └── data/
#       ├── db/              — MongoDB data files
#       ├── app/             — backend data: attachments, images, logs (owned by uid 1000)
#       └── caddy/           — SSL certificates and Caddy config
#
set -euo pipefail

SPACENOTE_VERSION="0.0.1"
SPACENOTE_DIR="/opt/spacenote"
GITHUB_RAW="https://raw.githubusercontent.com/mcbarinov/spacenote/main/deploy"

# --- Helpers ---

die() { echo "Error: $*" >&2; exit 1; }

require_root() {
    [[ $EUID -eq 0 ]] || die "This command requires root. Run with sudo."
}

require_docker() {
    command -v docker &>/dev/null || die "Docker is not installed. Run 'spacenote install' first."
}

require_spacenote() {
    [[ -f "$SPACENOTE_DIR/docker-compose.yml" ]] || die "SpaceNote is not installed. Run 'spacenote install' first."
}

# Read a value from .env by key. Uses grep+cut instead of `source` to handle special chars safely.
env_get() {
    grep -E "^${1}=" "$SPACENOTE_DIR/.env" 2>/dev/null | head -1 | cut -d'=' -f2-
}

# Shortcut for docker compose with correct paths.
dc() {
    docker compose -f "$SPACENOTE_DIR/docker-compose.yml" --env-file "$SPACENOTE_DIR/.env" "$@"
}

# Prompt for a required value. Loops until non-empty input.
prompt_required() {
    local prompt="$1" value
    while true; do
        read -rp "  $prompt: " value
        [[ -n "$value" ]] && break
        echo "  This field is required." >&2
    done
    echo "$value"
}

# Prompt for an optional value. Empty input is fine.
prompt_optional() {
    local value
    read -rp "  $1 (press Enter to skip): " value
    echo "$value"
}

# Yes/no confirmation prompt for destructive operations.
# Defaults to "no" — user must explicitly type y/yes to proceed.
confirm() {
    local answer
    read -rp "$1 [y/N]: " answer
    [[ "$answer" =~ ^[Yy]([Ee][Ss])?$ ]]
}

# --- Commands ---

# Full interactive setup for a fresh server:
#   1. Install Docker (if missing) via official get.docker.com
#   2. Create /opt/spacenote and download docker-compose.yml
#   3. Ask for domain, email, Telegram token; auto-generate MongoDB password
#   4. Create data directories with correct ownership (uid 1000 for backend)
#   5. Pull images and start all services
#
# After install: https://<domain>, login: admin / admin
cmd_install() {
    require_root

    # Guard against re-running on an existing install — would generate a new
    # MongoDB password while data/db still has the old one, breaking auth.
    if [[ -f "$SPACENOTE_DIR/.env" ]]; then
        die "SpaceNote is already installed. Use 'spacenote update' to upgrade, or remove $SPACENOTE_DIR to reinstall from scratch."
    fi

    echo "=== SpaceNote Installer ==="
    echo

    # Step 1: Docker
    if ! command -v docker &>/dev/null; then
        echo "Installing Docker..."
        curl -fsSL https://get.docker.com | sh
        echo "Docker installed."
    else
        echo "Docker is already installed."
    fi

    # Step 2: Download docker-compose.yml
    mkdir -p "$SPACENOTE_DIR"
    cd "$SPACENOTE_DIR"

    echo "Downloading docker-compose.yml..."
    curl -fsSL "$GITHUB_RAW/docker-compose.yml" -o docker-compose.yml

    # Step 3: Interactive configuration
    echo
    echo "Configuration:"
    echo

    local domain email mongo_password telegram_token

    domain=$(prompt_required "Domain (e.g. notes.example.com)")
    email=$(prompt_optional "Email for Let's Encrypt SSL")
    telegram_token=$(prompt_optional "Telegram bot token")

    # Caddy's Caddyfile requires an argument after `email`; empty value breaks config parsing.
    # Let's Encrypt accepts anything syntactically valid, so fall back to a placeholder.
    [[ -z "$email" ]] && email="mail@example.com"

    # 64 hex chars = 256 bits of entropy
    mongo_password=$(openssl rand -hex 32)

    # .env is the only config file; docker-compose.yml reads all settings from it
    cat > .env <<EOF
DOMAIN=${domain}
EMAIL=${email}
MONGODB_ROOT_USERNAME=root
MONGODB_ROOT_PASSWORD=${mongo_password}
TELEGRAM_BOT_TOKEN=${telegram_token}
EOF

    echo ".env created."

    # Step 4: Data directories
    #   db/     — MongoDB data (uid 1000 — pinned via `user:` in docker-compose.yml)
    #   app/    — backend uploads, images, logs (uid 1000 — backend container user)
    #   caddy/  — SSL certs (managed by Caddy / Let's Encrypt, runs as root)
    mkdir -p data/{db,app,caddy/data,caddy/config}
    cmd_fix_permissions

    # Step 5: Start
    echo
    echo "Starting services..."
    dc up -d --pull always

    echo
    echo "SpaceNote is running at https://${domain}"
    echo "Default login: admin / admin — change the password after first login!"
}

# Restore correct ownership for data directories.
# Needed after manually copying files (space imports, attachments via SSH, backups) —
# such files end up root-owned and the containers can't read them.
# Also called from cmd_install.
#
# Both the backend and the MongoDB container run as uid 1000.
# MongoDB uid is pinned via `user: "1000:1000"` in docker-compose.yml
# (overriding the image's default uid 998).
cmd_fix_permissions() {
    require_root
    require_spacenote
    chown -R 1000:1000 "$SPACENOTE_DIR/data/app" "$SPACENOTE_DIR/data/db"
    echo "Permissions fixed."
}

# Create a portable archive of the current deployment.
# Archive contains:
#   db.archive.gz   — mongodump of the spacenote database
#   app/            — copy of data/app/ (attachments, images, logs)
#   manifest.txt    — timestamp, source domain, CLI version
# Does NOT include: .env, docker-compose.yml, SSL certs, raw MongoDB files.
# Use for backups and server migration (dump here → scp → restore there).
cmd_dump() {
    require_docker
    require_spacenote

    local user pass domain timestamp staging archive
    user=$(env_get "MONGODB_ROOT_USERNAME")
    pass=$(env_get "MONGODB_ROOT_PASSWORD")
    domain=$(env_get "DOMAIN")
    [[ -n "$user" && -n "$pass" ]] || die "Cannot read MongoDB credentials from .env"

    # Verify MongoDB is running — mongodump needs a live connection
    docker inspect -f '{{.State.Running}}' spacenote-mongodb 2>/dev/null | grep -q true \
        || die "MongoDB container is not running. Start it with 'spacenote up' or 'docker compose up -d mongodb'."

    mkdir -p "$SPACENOTE_DIR/backups"
    timestamp=$(date +%Y%m%d-%H%M%S)
    staging=$(mktemp -d)
    archive="$SPACENOTE_DIR/backups/spacenote-${timestamp}.tar.gz"

    # Clean up staging on exit (success or failure).
    # Early expansion of $staging is intentional: it's a local var, and with `set -u`
    # late expansion would error once the function returns.
    # shellcheck disable=SC2064
    trap "rm -rf '$staging'" EXIT

    echo "Dumping MongoDB..."
    # Credentials via env to keep them out of the host's process list.
    docker exec -e MONGO_USER="$user" -e MONGO_PASS="$pass" spacenote-mongodb \
        sh -c 'mongodump -u "$MONGO_USER" -p "$MONGO_PASS" --authenticationDatabase admin --db spacenote --archive --gzip' \
        > "$staging/db.archive.gz"

    echo "Copying data/app/..."
    cp -a "$SPACENOTE_DIR/data/app" "$staging/app"

    cat > "$staging/manifest.txt" <<EOF
timestamp=${timestamp}
source_domain=${domain}
cli_version=${SPACENOTE_VERSION}
db_name=spacenote
EOF

    echo "Creating archive..."
    tar -czf "$archive" -C "$staging" .

    local size
    size=$(du -h "$archive" | cut -f1)
    echo "Dump created: $archive ($size)"
}

# Restore a deployment from an archive created by `spacenote dump`.
# DESTRUCTIVE — replaces current database and data/app/.
# Keeps existing .env and SSL certs (target server's own config).
cmd_restore() {
    require_docker
    require_spacenote

    local archive="${1:-}"
    [[ -n "$archive" ]] || die "Usage: spacenote restore <archive.tar.gz>"
    [[ -f "$archive" ]] || die "Archive not found: $archive"

    # Validate archive contents before touching anything
    local contents
    contents=$(tar -tzf "$archive" 2>/dev/null) || die "Cannot read archive: $archive"
    echo "$contents" | grep -qE '^(\./)?manifest\.txt$' || die "Invalid archive: missing manifest.txt"
    echo "$contents" | grep -qE '^(\./)?db\.archive\.gz$' || die "Invalid archive: missing db.archive.gz"
    echo "$contents" | grep -qE '^(\./)?app/' || die "Invalid archive: missing app/ directory"

    local staging
    staging=$(mktemp -d)
    # shellcheck disable=SC2064  # see cmd_dump for rationale
    trap "rm -rf '$staging'" EXIT

    # Read manifest from archive for confirmation prompt
    tar -xzf "$archive" -C "$staging" ./manifest.txt 2>/dev/null || tar -xzf "$archive" -C "$staging" manifest.txt
    local source_domain
    source_domain=$(grep "^source_domain=" "$staging/manifest.txt" | cut -d'=' -f2-)

    echo "Archive: $archive"
    echo "Source domain: $source_domain"
    echo
    echo "This will REPLACE all current data (database + data/app/)."
    confirm "Continue?" || { echo "Aborted."; exit 0; }

    local user pass
    user=$(env_get "MONGODB_ROOT_USERNAME")
    pass=$(env_get "MONGODB_ROOT_PASSWORD")
    [[ -n "$user" && -n "$pass" ]] || die "Cannot read MongoDB credentials from .env"

    echo "Extracting archive..."
    tar -xzf "$archive" -C "$staging"

    echo "Starting MongoDB..."
    dc up -d mongodb
    echo "Waiting for MongoDB to accept connections..."
    local i=0
    until docker exec spacenote-mongodb mongosh --quiet --eval 'db.runCommand({ping:1})' >/dev/null 2>&1; do
        i=$((i+1))
        [[ $i -gt 30 ]] && die "MongoDB did not become ready within 30s"
        sleep 1
    done

    echo "Stopping backend to prevent writes during restore..."
    dc stop backend 2>/dev/null || true

    echo "Replacing data/app/..."
    rm -rf "$SPACENOTE_DIR/data/app"
    mv "$staging/app" "$SPACENOTE_DIR/data/app"

    echo "Fixing permissions..."
    chown -R 1000:1000 "$SPACENOTE_DIR/data/app" "$SPACENOTE_DIR/data/db"

    echo "Restoring database..."
    docker exec -i -e MONGO_USER="$user" -e MONGO_PASS="$pass" spacenote-mongodb \
        sh -c 'mongorestore -u "$MONGO_USER" -p "$MONGO_PASS" --authenticationDatabase admin --db spacenote --drop --archive --gzip' \
        < "$staging/db.archive.gz"

    echo "Starting backend..."
    dc up -d backend

    echo
    echo "Restore complete."
    echo "Note: admin credentials are inherited from the source. Change the password if needed."
}

# Pull latest images from GHCR and restart.
# Typical workflow: dev runs `just docker-push`, then `spacenote update` on server.
cmd_update() {
    require_docker
    require_spacenote

    echo "Pulling latest images..."
    dc pull
    echo "Restarting services..."
    dc up -d
    echo "Update complete."
}

# Show container status and backend health check.
cmd_status() {
    require_docker
    require_spacenote

    dc ps
    echo

    # Backend exposes GET /health → {"status": "ok"}
    # Called from inside the container to avoid SSL/DNS issues.
    local health
    if health=$(docker exec spacenote-backend curl -sf http://localhost:8000/health 2>/dev/null); then
        echo "Backend health: $health"
    else
        echo "Backend health check failed."
    fi
}

# Follow Docker Compose logs. Optional service filter.
#   spacenote logs           — all services
#   spacenote logs backend   — only backend
cmd_logs() {
    require_docker
    require_spacenote
    dc logs -f "$@"
}

# Show CLI version and running container images.
cmd_version() {
    echo "spacenote CLI v${SPACENOTE_VERSION}"

    if [[ -f "$SPACENOTE_DIR/docker-compose.yml" ]] && command -v docker &>/dev/null; then
        echo
        for container in spacenote-backend spacenote-frontend spacenote-mongodb spacenote-caddy; do
            local image
            if image=$(docker inspect --format '{{.Config.Image}}' "$container" 2>/dev/null); then
                printf "  %-10s %s\n" "${container#spacenote-}:" "$image"
            fi
        done
    fi
}

# Open MongoDB shell with credentials auto-read from .env.
cmd_mongo_shell() {
    require_docker
    require_spacenote

    local user pass
    user=$(env_get "MONGODB_ROOT_USERNAME")
    pass=$(env_get "MONGODB_ROOT_PASSWORD")
    [[ -n "$user" && -n "$pass" ]] || die "Cannot read MongoDB credentials from .env"

    docker exec -it -e MONGO_USER="$user" -e MONGO_PASS="$pass" spacenote-mongodb \
        sh -c 'mongosh -u "$MONGO_USER" -p "$MONGO_PASS" --authenticationDatabase admin spacenote'
}

# Download the latest script from GitHub and replace /usr/local/bin/spacenote.
# Uses a temp file so a failed download doesn't leave a broken script.
cmd_self_update() {
    require_root

    echo "Downloading latest version..."
    local tmp
    tmp=$(mktemp)
    if curl -fsSL "$GITHUB_RAW/spacenote.sh" -o "$tmp"; then
        chmod +x "$tmp"
        mv "$tmp" /usr/local/bin/spacenote
        echo "Updated to $(spacenote version | head -1)"
    else
        rm -f "$tmp"
        die "Download failed."
    fi
}

cmd_help() {
    cat <<EOF
spacenote — server management CLI for SpaceNote

Usage: spacenote <command> [args]

Commands:
  install           Install SpaceNote on a fresh server
  update            Pull latest images and restart services
  status            Show service status and health
  logs [svc]        Follow container logs (optional: backend, frontend, mongodb, caddy)
  version           Show CLI and image versions
  mongo-shell       Open MongoDB shell
  fix-permissions   Restore ownership of data/ dirs (after manual file edits)
  dump              Create portable archive of DB + data/app/ in backups/
  restore <path>    Restore deployment from an archive (destructive)
  self-update       Update this CLI script from GitHub
  help              Show this help

Quick install:
  curl -fsSL $GITHUB_RAW/spacenote.sh | sudo bash

EOF
}

# --- Piped install detection ---
# When run via `curl ... | bash`, stdin is not a terminal and no args are passed.
# We install the CLI to /usr/local/bin and tell the user to run `spacenote install`.
# We can't auto-run install because stdin is consumed by the pipe (no interactive prompts).
# The script re-downloads itself from GitHub (bash already consumed the piped stdin).

if [[ ! -t 0 ]] && [[ "${1:-}" == "" ]]; then
    [[ $EUID -eq 0 ]] || die "Run with: curl -fsSL $GITHUB_RAW/spacenote.sh | sudo bash"
    echo "Installing spacenote CLI..."
    curl -fsSL "$GITHUB_RAW/spacenote.sh" -o /usr/local/bin/spacenote
    chmod +x /usr/local/bin/spacenote
    echo "Installed to /usr/local/bin/spacenote"
    echo "Now run: spacenote install"
    exit 0
fi

# --- Main ---

case "${1:-}" in
    install)      cmd_install ;;
    update)       cmd_update ;;
    status)       cmd_status ;;
    logs)         shift; cmd_logs "$@" ;;
    version)      cmd_version ;;
    mongo-shell)  cmd_mongo_shell ;;
    fix-permissions) cmd_fix_permissions ;;
    dump)         cmd_dump ;;
    restore)      shift; cmd_restore "$@" ;;
    self-update)  cmd_self_update ;;
    help|--help|-h|"")  cmd_help ;;
    *)            die "Unknown command: $1. Run 'spacenote help' for usage." ;;
esac
