# syntax=docker/dockerfile:1.6

FROM node:24-alpine AS builder

WORKDIR /app

ENV PNPM_HOME=/pnpm
ENV PATH="$PNPM_HOME:$PATH"

RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy workspace configuration
COPY pnpm-lock.yaml pnpm-workspace.yaml ./

# Copy package.json files for workspace packages
COPY packages/common/package.json ./packages/common/
COPY apps/web/package.json ./apps/web/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY packages/common ./packages/common
COPY apps/web ./apps/web

# Build
ARG GIT_COMMIT_HASH=unknown
ARG GIT_COMMIT_DATE=unknown
ARG BUILD_TIME=unknown

WORKDIR /app/apps/web

RUN VITE_GIT_COMMIT_HASH=${GIT_COMMIT_HASH} \
    VITE_GIT_COMMIT_DATE=${GIT_COMMIT_DATE} \
    VITE_BUILD_TIME=${BUILD_TIME} \
    pnpm build

# Production stage
FROM node:24-alpine AS runner

WORKDIR /app

RUN npm install --global serve@14

COPY --from=builder /app/apps/web/dist ./dist
COPY apps/web/entrypoint.sh /entrypoint.sh

RUN chmod +x /entrypoint.sh

ENV NODE_ENV=production

EXPOSE 4173

ENTRYPOINT ["/entrypoint.sh"]
CMD ["serve", "-s", "dist", "-l", "4173"]
