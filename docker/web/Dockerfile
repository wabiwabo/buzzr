# =============================================================================
# Stage 1: Builder
# =============================================================================
FROM node:20-alpine AS builder

RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

WORKDIR /app

# Copy workspace config
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml turbo.json tsconfig.base.json ./

# Copy package.json files for all workspace packages
COPY apps/web/package.json apps/web/
COPY apps/web/tsconfig.json apps/web/
COPY apps/web/tsconfig.node.json apps/web/
COPY apps/web/vite.config.ts apps/web/
COPY apps/web/index.html apps/web/
COPY packages/shared-types/package.json packages/shared-types/
COPY packages/constants/package.json packages/constants/
COPY packages/validators/package.json packages/validators/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code for packages and web app
COPY packages/ packages/
COPY apps/web/src/ apps/web/src/

# Build all packages and the web app
RUN pnpm run build --filter=@buzzr/web

# =============================================================================
# Stage 2: Runner (nginx to serve static files)
# =============================================================================
FROM nginx:alpine AS runner

# Copy built web app to nginx html directory
COPY --from=builder /app/apps/web/dist /usr/share/nginx/html

# Add SPA fallback nginx config
RUN echo 'server { \
    listen 80; \
    root /usr/share/nginx/html; \
    index index.html; \
    location / { \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
