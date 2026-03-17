# syntax=docker/dockerfile:1.6

FROM node:24-alpine AS builder

WORKDIR /app

ENV PNPM_HOME=/pnpm
ENV PATH="$PNPM_HOME:$PATH"

RUN corepack enable && corepack prepare pnpm@latest --activate

# Configure pnpm store for BuildKit cache
RUN pnpm config set store-dir /pnpm/store

# Copy dependency files
COPY pnpm-lock.yaml package.json ./

# Install dependencies (with BuildKit cache for pnpm store)
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build args
ARG GIT_COMMIT_HASH=unknown

# Build (skip tsc type checking - done locally before push)
RUN VITE_GIT_COMMIT_HASH=${GIT_COMMIT_HASH} pnpm vite build

# Production stage
FROM node:24-alpine AS runner

WORKDIR /app

RUN npm install --global serve@14 && apk add --no-cache wget

COPY --from=builder /app/dist ./dist

ENV NODE_ENV=production

EXPOSE 4173

CMD ["serve", "-s", "dist", "-l", "4173"]
