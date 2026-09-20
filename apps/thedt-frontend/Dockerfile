FROM node:22-alpine AS base
RUN npm install -g pnpm@9.15.0

# ── Install dependencies ──────────────────────────────────────────────────────
FROM base AS deps
WORKDIR /repo

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/shared/config/package.json             packages/shared/config/package.json
COPY packages/shared/utils/package.json              packages/shared/utils/package.json
COPY packages/frontend-shared/package.json    packages/frontend-shared/package.json
COPY apps/thedt-frontend/package.json           apps/thedt-frontend/package.json

RUN pnpm install --frozen-lockfile

# ── Build ─────────────────────────────────────────────────────────────────────
FROM deps AS builder
WORKDIR /repo

COPY packages/ packages/
COPY apps/thedt-frontend/ apps/thedt-frontend/

# Committed .env.build contains public NEXT_PUBLIC_* vars; Next reads it at build time
RUN cp apps/thedt-frontend/.env.build apps/thedt-frontend/.env.production

RUN pnpm --filter thedt-frontend build

RUN cp -r apps/thedt-frontend/.next/static \
         apps/thedt-frontend/.next/standalone/apps/thedt-frontend/.next/static && \
    cp -r apps/thedt-frontend/public \
         apps/thedt-frontend/.next/standalone/apps/thedt-frontend/public

# ── Production image ──────────────────────────────────────────────────────────
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

COPY --from=builder /repo/apps/thedt-frontend/.next/standalone ./

EXPOSE 3000
CMD ["node", "apps/thedt-frontend/server.js"]
