FROM node:22-alpine AS base
RUN npm install -g pnpm@9.15.0

# ── Install dependencies ──────────────────────────────────────────────────────
FROM base AS deps
WORKDIR /repo

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/shared/config/package.json             packages/shared/config/package.json
COPY packages/shared/utils/package.json              packages/shared/utils/package.json
COPY packages/frontend-shared/package.json    packages/frontend-shared/package.json
COPY apps/visawadi-frontend/package.json         apps/visawadi-frontend/package.json

RUN pnpm install --frozen-lockfile

# ── Build ─────────────────────────────────────────────────────────────────────
FROM deps AS builder
WORKDIR /repo

COPY packages/ packages/
COPY apps/visawadi-frontend/ apps/visawadi-frontend/

# Committed .env.build contains public NEXT_PUBLIC_* vars; Next reads it at build time
RUN cp apps/visawadi-frontend/.env.build apps/visawadi-frontend/.env.production

RUN pnpm --filter visawadi-frontend build

# Next standalone in a monorepo nests the output under apps/visawadi-frontend/
# Static + public must be copied into that same nested location
RUN cp -r apps/visawadi-frontend/.next/static \
         apps/visawadi-frontend/.next/standalone/apps/visawadi-frontend/.next/static && \
    cp -r apps/visawadi-frontend/public \
         apps/visawadi-frontend/.next/standalone/apps/visawadi-frontend/public

# ── Production image ──────────────────────────────────────────────────────────
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

# Standalone already contains its own node_modules
COPY --from=builder /repo/apps/visawadi-frontend/.next/standalone ./

EXPOSE 3000
CMD ["node", "apps/visawadi-frontend/server.js"]
