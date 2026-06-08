FROM node:22-alpine AS base
RUN npm install -g pnpm@9.15.0

# ── Install dependencies ──────────────────────────────────────────────────────
FROM base AS deps
WORKDIR /repo

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/shared/config/package.json             packages/shared/config/package.json
COPY packages/shared/utils/package.json              packages/shared/utils/package.json
COPY packages/frontend-shared/package.json           packages/frontend-shared/package.json
COPY apps/emirateslimo-frontend/package.json         apps/emirateslimo-frontend/package.json

RUN pnpm install --frozen-lockfile

# ── Build ─────────────────────────────────────────────────────────────────────
FROM deps AS builder
WORKDIR /repo

COPY packages/ packages/
COPY apps/emirateslimo-frontend/ apps/emirateslimo-frontend/

# Committed .env.build holds public NEXT_PUBLIC_* vars; Next reads it at build time
RUN cp apps/emirateslimo-frontend/.env.build apps/emirateslimo-frontend/.env.production

RUN pnpm --filter emirateslimo-frontend build

RUN cp -r apps/emirateslimo-frontend/.next/static \
         apps/emirateslimo-frontend/.next/standalone/apps/emirateslimo-frontend/.next/static && \
    cp -r apps/emirateslimo-frontend/public \
         apps/emirateslimo-frontend/.next/standalone/apps/emirateslimo-frontend/public

# ── Production image ──────────────────────────────────────────────────────────
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

COPY --from=builder /repo/apps/emirateslimo-frontend/.next/standalone ./

EXPOSE 3000
CMD ["node", "apps/emirateslimo-frontend/server.js"]
