FROM node:22-alpine AS base
RUN npm install -g pnpm@9.15.0

# ── Install dependencies ──────────────────────────────────────────────────────
FROM base AS deps
WORKDIR /repo

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/config/package.json             packages/config/package.json
COPY packages/utils/package.json              packages/utils/package.json
COPY packages/frontend-shared/package.json    packages/frontend-shared/package.json
COPY apps/travl-frontend/package.json         apps/travl-frontend/package.json

RUN pnpm install --frozen-lockfile

# ── Build ─────────────────────────────────────────────────────────────────────
FROM deps AS builder
WORKDIR /repo

COPY packages/ packages/
COPY apps/travl-frontend/ apps/travl-frontend/

# Committed .env.build contains public NEXT_PUBLIC_* vars; Next reads it at build time
RUN cp apps/travl-frontend/.env.build apps/travl-frontend/.env.production

RUN pnpm --filter travl-frontend build

# Next standalone in a monorepo nests the output under apps/travl-frontend/
# Static + public must be copied into that same nested location
RUN cp -r apps/travl-frontend/.next/static \
         apps/travl-frontend/.next/standalone/apps/travl-frontend/.next/static && \
    cp -r apps/travl-frontend/public \
         apps/travl-frontend/.next/standalone/apps/travl-frontend/public

# ── Production image ──────────────────────────────────────────────────────────
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

# Standalone already contains its own node_modules
COPY --from=builder /repo/apps/travl-frontend/.next/standalone ./

EXPOSE 3000
CMD ["node", "apps/travl-frontend/server.js"]
