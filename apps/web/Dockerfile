# syntax=docker/dockerfile:1.6

FROM node:24-alpine AS builder

WORKDIR /app

ENV PNPM_HOME=/pnpm
ENV PATH="$PNPM_HOME:$PATH"

RUN corepack enable && corepack prepare pnpm@latest --activate

# Configure pnpm store for BuildKit cache
RUN pnpm config set store-dir /pnpm/store

# Copy workspace configuration
COPY pnpm-lock.yaml pnpm-workspace.yaml ./

# Copy package.json files for workspace packages
COPY packages/common/package.json ./packages/common/
COPY apps/web/package.json ./apps/web/

# Install dependencies (with BuildKit cache for pnpm store)
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile

# Copy source code
COPY packages/common ./packages/common
COPY apps/web ./apps/web

# Build args
ARG GIT_COMMIT_HASH=unknown
ARG GIT_COMMIT_DATE=unknown
ARG BUILD_TIME=unknown

WORKDIR /app/apps/web

# Build (skip tsc type checking - done locally before push)
RUN VITE_GIT_COMMIT_HASH=${GIT_COMMIT_HASH} \
    VITE_GIT_COMMIT_DATE=${GIT_COMMIT_DATE} \
    VITE_BUILD_TIME=${BUILD_TIME} \
    pnpm vite build

# Production stage
FROM node:24-alpine AS runner

WORKDIR /app

RUN npm install --global serve@14 && apk add --no-cache wget

COPY --from=builder /app/apps/web/dist ./dist

ENV NODE_ENV=production

EXPOSE 4173

CMD ["serve", "-s", "dist", "-l", "4173"]
