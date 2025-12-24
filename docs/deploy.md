# Deployment Guide

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                    Internet                         │
└─────────────────────┬───────────────────────────────┘
                      │ :80/:443
┌─────────────────────▼───────────────────────────────┐
│                    Caddy                            │
│              (reverse proxy + SSL)                  │
└──────┬──────────────┬──────────────────┬────────────┘
       │ /api/*       │ /admin/*         │ /*
┌──────▼──────┐ ┌─────▼──────┐ ┌─────────▼─────────┐
│   Backend   │ │   Admin    │ │       Web         │
│  (FastAPI)  │ │  (serve)   │ │     (serve)       │
└──────┬──────┘ └────────────┘ └───────────────────┘
       │
┌──────▼──────┐
│   MongoDB   │
└─────────────┘
```

**Key decisions:**
- **Caddy**: Auto-SSL via Let's Encrypt, simple config
- **GHCR**: Free container registry for public repos
- **Multi-stage builds**: Smaller images, BuildKit caching
- **Relative API paths**: Frontend uses `/api` path, Caddy routes to backend
- **Non-root**: Backend runs as uid 1000 for security

## Workflow

1. **Dev machine**: `just docker-push` (builds linux/amd64 images and pushes to GHCR)
2. **Server**: `docker compose up -d --pull always`

## Prerequisites

**Dev machine:**
- Docker
- just (command runner)

**Server:**
- Ubuntu 24.04 LTS (or similar)
- Docker Engine
- 2GB+ RAM, 10GB+ disk

## One-time Setup

### 1. GHCR Login (dev machine)

```bash
# Create a Personal Access Token at https://github.com/settings/tokens
# with 'write:packages' scope

docker login ghcr.io -u YOUR_GITHUB_USERNAME
# Enter your PAT as password
```

### 2. Server Setup

```bash
# Install Docker
curl -fsSL https://get.docker.com | sh

# Create app directory
mkdir -p /opt/spacenote
cd /opt/spacenote

# Download docker-compose.yml and .env
curl -O https://raw.githubusercontent.com/mcbarinov/spacenote/main/deploy/docker-compose.yml
curl -O https://raw.githubusercontent.com/mcbarinov/spacenote/main/deploy/.env.example
mv .env.example .env

# Create data directories with correct permissions
mkdir -p ./data/attachments ./data/images
chown -R 1000:1000 ./data/attachments ./data/images

# Edit .env with your settings
nano .env
```

### 3. Configure .env

```bash
# Required
DOMAIN=your-domain.com
EMAIL=admin@your-domain.com
MONGODB_ROOT_USERNAME=root
MONGODB_ROOT_PASSWORD=<generate with: openssl rand -hex 32>

# Optional
TELEGRAM_BOT_TOKEN=
DEBUG=false
```

## Deployment Workflow

### Build & Push (dev machine)

```bash
# Build and push all images to GHCR (linux/amd64)
just docker-push

# Or push specific service
just docker-push-backend
just docker-push-web
just docker-push-admin

# Build locally for testing (native arch, loads into local Docker)
just docker-build
just docker-build-backend
just docker-build-web
just docker-build-admin
```

### Deploy / Update (server)

```bash
cd /opt/spacenote

# Pull and restart
docker compose up -d --pull always

# Check status
docker compose ps
docker compose logs -f
```

## URL Structure (Production)

| Path | Service |
|------|---------|
| `https://domain.com/` | Web app |
| `https://domain.com/admin/` | Admin panel |
| `https://domain.com/api/` | Backend API |

Caddy handles SSL certificates automatically via Let's Encrypt.

## Local Development with Docker

```bash
# Start local stack (builds + runs)
just docker-local

# Stop
just docker-local-down
```

Local URLs (via Caddy at port 8080):
- Web: http://localhost:8080
- Admin: http://localhost:8080/admin/
- API: http://localhost:8080/api/
- MongoDB: localhost:27017 (direct access)

## Data Persistence

All data stored in bind mounts under `./data/`:

```
data/
├── mongodb/        # Database files (created by MongoDB container)
├── attachments/    # User uploads (uid 1000)
├── images/         # Processed images (uid 1000)
├── caddy-data/     # SSL certificates
└── caddy-config/   # Caddy config
```

**Note:** `attachments/` and `images/` must be owned by uid 1000 (backend user).

## Backup

```bash
# Full backup
cd /opt/spacenote
tar -czf backup-$(date +%Y%m%d).tar.gz ./data/

# Restore
tar -xzf backup-20250101.tar.gz
```

## Common Commands

```bash
# View logs
docker compose logs -f
docker compose logs -f backend

# Restart service
docker compose restart backend

# Shell into container
docker exec -it spacenote-backend bash

# MongoDB shell
docker exec -it spacenote-mongodb mongosh -u root -p

# Check health
curl https://your-domain.com/api/health
```

## MongoDB Shell Access

**Local:**
```bash
mongosh spacenote
```

**Production (Docker):**
```bash
docker exec -it spacenote-mongodb mongosh -u root -p --authenticationDatabase admin spacenote
```

## Troubleshooting

**SSL certificate issues:**
```bash
# Check Caddy logs
docker compose logs caddy

# Force certificate renewal
docker compose restart caddy
```

**MongoDB fails to start:**
```bash
# Check logs
docker compose logs mongodb

# If "Permission denied" on /data/db/journal - reset MongoDB data
docker compose down
sudo rm -rf ./data/mongodb
docker compose up -d
```

**Backend permission errors (attachments/images):**
```bash
# Backend runs as uid 1000
sudo mkdir -p ./data/attachments ./data/images
sudo chown -R 1000:1000 ./data/attachments ./data/images
docker compose restart backend
```
