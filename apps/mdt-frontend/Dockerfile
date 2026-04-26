FROM node:22-alpine AS base
RUN npm install -g pnpm@9.15.0

# ── Install dependencies ──────────────────────────────────────────────────────
FROM base AS deps
WORKDIR /repo

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/config/package.json             packages/config/package.json
COPY packages/utils/package.json              packages/utils/package.json
COPY packages/frontend-shared/package.json    packages/frontend-shared/package.json
COPY apps/mdt-frontend/package.json           apps/mdt-frontend/package.json

RUN pnpm install --frozen-lockfile

# ── Build ─────────────────────────────────────────────────────────────────────
FROM deps AS builder
WORKDIR /repo

COPY packages/ packages/
COPY apps/mdt-frontend/ apps/mdt-frontend/

# Committed .env.build contains public NEXT_PUBLIC_* vars; Next reads it at build time
RUN cp apps/mdt-frontend/.env.build apps/mdt-frontend/.env.production

RUN pnpm --filter mdt-frontend build

RUN cp -r apps/mdt-frontend/.next/static \
         apps/mdt-frontend/.next/standalone/apps/mdt-frontend/.next/static && \
    cp -r apps/mdt-frontend/public \
         apps/mdt-frontend/.next/standalone/apps/mdt-frontend/public

# ── Production image ──────────────────────────────────────────────────────────
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

COPY --from=builder /repo/apps/mdt-frontend/.next/standalone ./

EXPOSE 3000
CMD ["node", "apps/mdt-frontend/server.js"]
