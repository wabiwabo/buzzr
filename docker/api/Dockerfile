# =============================================================================
# Stage 1: Builder
# =============================================================================
FROM node:20-alpine AS builder

RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

WORKDIR /app

# Copy workspace config
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml turbo.json tsconfig.base.json ./

# Copy package.json files for all workspace packages
COPY apps/api/package.json apps/api/
COPY apps/api/tsconfig.json apps/api/
COPY apps/api/nest-cli.json apps/api/
COPY packages/shared-types/package.json packages/shared-types/
COPY packages/constants/package.json packages/constants/
COPY packages/validators/package.json packages/validators/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code for packages and API
COPY packages/ packages/
COPY apps/api/src/ apps/api/src/

# Build all packages and the API
RUN pnpm run build --filter=@buzzr/api

# =============================================================================
# Stage 2: Runner
# =============================================================================
FROM node:20-alpine AS runner

RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

# Install curl for healthcheck
RUN apk add --no-cache curl

WORKDIR /app

# Copy workspace config
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./

# Copy package.json files
COPY apps/api/package.json apps/api/
COPY packages/shared-types/package.json packages/shared-types/
COPY packages/constants/package.json packages/constants/
COPY packages/validators/package.json packages/validators/

# Install production dependencies only
RUN pnpm install --frozen-lockfile --prod

# Copy built artifacts
COPY --from=builder /app/apps/api/dist apps/api/dist
COPY --from=builder /app/packages/shared-types/dist packages/shared-types/dist
COPY --from=builder /app/packages/constants/dist packages/constants/dist
COPY --from=builder /app/packages/validators/dist packages/validators/dist

ENV NODE_ENV=production
EXPOSE 3000

WORKDIR /app/apps/api

CMD ["node", "dist/main.js"]
