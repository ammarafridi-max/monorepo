FROM node:22-alpine AS base
RUN npm install -g pnpm@9.15.0

# ── Install dependencies ──────────────────────────────────────────────────────
FROM base AS deps
WORKDIR /repo

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/shared/config/package.json             packages/shared/config/package.json
COPY packages/shared/utils/package.json              packages/shared/utils/package.json
COPY packages/frontend-shared/package.json    packages/frontend-shared/package.json
COPY apps/airportrides-frontend/package.json  apps/airportrides-frontend/package.json

RUN pnpm install --frozen-lockfile

# ── Build ─────────────────────────────────────────────────────────────────────
FROM deps AS builder
WORKDIR /repo

COPY packages/ packages/
COPY apps/airportrides-frontend/ apps/airportrides-frontend/

# Committed .env.build contains public NEXT_PUBLIC_* vars; Next reads it at build time
RUN cp apps/airportrides-frontend/.env.build apps/airportrides-frontend/.env.production

RUN pnpm --filter airportrides-frontend build

RUN cp -r apps/airportrides-frontend/.next/static \
         apps/airportrides-frontend/.next/standalone/apps/airportrides-frontend/.next/static && \
    cp -r apps/airportrides-frontend/public \
         apps/airportrides-frontend/.next/standalone/apps/airportrides-frontend/public

# ── Production image ──────────────────────────────────────────────────────────
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

COPY --from=builder /repo/apps/airportrides-frontend/.next/standalone ./

EXPOSE 3000
CMD ["node", "apps/airportrides-frontend/server.js"]
