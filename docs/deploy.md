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
- **Runtime config**: `entrypoint.sh` injects API_URL at start (no rebuild for different envs)
- **Non-root**: Backend runs as uid 1000 for security

## Workflow

1. **Dev machine**: `just deploy-push` (builds linux/amd64 images and pushes to GHCR)
2. **Server**: `docker compose pull && docker compose up -d`

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

# Download docker-compose.yml
curl -O https://raw.githubusercontent.com/mcbarinov/spacenote/main/deploy/docker-compose.yml

# Create .env from example
curl -O https://raw.githubusercontent.com/mcbarinov/spacenote/main/deploy/.env.example
mv .env.example .env

# Edit .env with your settings
nano .env

# Create data directories with correct permissions
mkdir -p ./data/attachments ./data/images
chown -R 1000:1000 ./data/attachments ./data/images
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
just deploy-push

# Or push specific service
just deploy-push-backend
just deploy-push-web
just deploy-push-admin

# Build locally for testing (native arch, loads into local Docker)
just deploy-build
just deploy-build-backend
just deploy-build-web
just deploy-build-admin
```

### Deploy (server)

```bash
cd /opt/spacenote

# Pull new images
docker compose pull

# Restart with new images
docker compose up -d

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
just deploy-local

# Stop
just deploy-local-down
```

Local ports:
- Web: http://localhost:4173
- Admin: http://localhost:4174
- Backend: http://localhost:8000
- MongoDB: localhost:27017

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
