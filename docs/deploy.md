# Deployment Guide

## Workflow

1. **Dev machine**: `just deploy-build` → `just deploy-push` (images go to GHCR)
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
```

### 3. Configure .env

```bash
# Required
DOMAIN=your-domain.com
EMAIL=admin@your-domain.com
MONGODB_ROOT_USERNAME=root
MONGODB_ROOT_PASSWORD=<generate with: openssl rand -hex 32>
SESSION_SECRET_KEY=<generate with: openssl rand -hex 32>

# Optional
TELEGRAM_BOT_TOKEN=
DEBUG=false
```

## Deployment Workflow

### Build & Push (dev machine)

```bash
# Build all images
just deploy-build

# Push to GHCR
just deploy-push

# Or build and push specific service
just deploy-build-backend
just deploy-push-backend
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
├── mongodb/        # Database files
├── attachments/    # User uploads
├── images/         # Processed images
├── caddy-data/     # SSL certificates
└── caddy-config/   # Caddy config
```

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

**Database connection errors:**
```bash
# Check MongoDB is healthy
docker compose ps mongodb
docker compose logs mongodb
```

**Permission errors on data folders:**
```bash
# Backend runs as uid 1000
sudo chown -R 1000:1000 ./data/attachments ./data/images
```
