# syntax=docker/dockerfile:1
#
# Picturesk web (Next.js). Build context = the monorepo root:
#   fly deploy -c fly.picturesk-web.toml
#
# NEXT_PUBLIC_* values are inlined at BUILD time, so they are passed as build args
# (set them in fly.picturesk-web.toml [build.args]), NOT runtime secrets. Runtime
# secrets (MONGODB_URI, AUTH_SECRET, SENTRY_DSN, OAuth) come from `fly secrets` and
# are read by server components at request time.
#
FROM node:22-alpine AS base
RUN npm install -g pnpm@9.15.0

# ── Install dependencies (cached separately from source) ─────────────────────
FROM base AS deps
WORKDIR /repo

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./

# Every workspace package the web app pulls in. pnpm links a package's peer
# dependencies only if its manifest is present at install time, so a missing line
# here builds fine and then dies at runtime with ERR_MODULE_NOT_FOUND.
COPY packages/picturesk-shared/package.json  packages/picturesk-shared/package.json
COPY packages/frontend-shared/package.json   packages/frontend-shared/package.json
COPY packages/shared/utils/package.json      packages/shared/utils/package.json
COPY apps/picturesk-web/package.json         apps/picturesk-web/package.json

RUN pnpm install --frozen-lockfile

# ── Build ────────────────────────────────────────────────────────────────────
FROM deps AS builder
WORKDIR /repo

COPY packages/ packages/
COPY apps/picturesk-web/ apps/picturesk-web/

# Build-time public config (inlined into the client bundle). NEXT_PUBLIC_API_BASE_URL
# MUST point at the deployed API origin. The rest are optional (code has defaults).
ARG NEXT_PUBLIC_API_BASE_URL
# The shared admin UI (@travel-suite/frontend-shared) reads NEXT_PUBLIC_BACKEND_URL
# and calls the same api under /api. Same origin as NEXT_PUBLIC_API_BASE_URL.
ARG NEXT_PUBLIC_BACKEND_URL
ARG NEXT_PUBLIC_UPLOAD_MIN_PHOTOS=5
ARG NEXT_PUBLIC_UPLOAD_MAX_PHOTOS=15
ARG NEXT_PUBLIC_UPLOAD_MIN_FACE_RATIO=0.15
ARG NEXT_PUBLIC_ANALYTICS_DOMAIN=""
ARG NEXT_PUBLIC_ANALYTICS_SRC=""
ARG NEXT_PUBLIC_GA_ID=""
ARG NEXT_PUBLIC_CLARITY_ID=""
ARG NEXT_PUBLIC_SENTRY_DSN=""
ARG NEXT_PUBLIC_SENTRY_ENVIRONMENT="production"
ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL \
    NEXT_PUBLIC_BACKEND_URL=$NEXT_PUBLIC_BACKEND_URL \
    NEXT_PUBLIC_UPLOAD_MIN_PHOTOS=$NEXT_PUBLIC_UPLOAD_MIN_PHOTOS \
    NEXT_PUBLIC_UPLOAD_MAX_PHOTOS=$NEXT_PUBLIC_UPLOAD_MAX_PHOTOS \
    NEXT_PUBLIC_UPLOAD_MIN_FACE_RATIO=$NEXT_PUBLIC_UPLOAD_MIN_FACE_RATIO \
    NEXT_PUBLIC_ANALYTICS_DOMAIN=$NEXT_PUBLIC_ANALYTICS_DOMAIN \
    NEXT_PUBLIC_ANALYTICS_SRC=$NEXT_PUBLIC_ANALYTICS_SRC \
    NEXT_PUBLIC_GA_ID=$NEXT_PUBLIC_GA_ID \
    NEXT_PUBLIC_CLARITY_ID=$NEXT_PUBLIC_CLARITY_ID \
    NEXT_PUBLIC_SENTRY_DSN=$NEXT_PUBLIC_SENTRY_DSN \
    NEXT_PUBLIC_SENTRY_ENVIRONMENT=$NEXT_PUBLIC_SENTRY_ENVIRONMENT \
    NODE_ENV=production

RUN pnpm --filter picturesk-web build

# Next standalone in a monorepo nests the output under apps/picturesk-web/.
# Static + public must be copied into that same nested location.
RUN cp -r apps/picturesk-web/.next/static \
         apps/picturesk-web/.next/standalone/apps/picturesk-web/.next/static && \
    cp -r apps/picturesk-web/public \
         apps/picturesk-web/.next/standalone/apps/picturesk-web/public

# ── Production image ─────────────────────────────────────────────────────────
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

# Standalone already contains its own node_modules
COPY --from=builder /repo/apps/picturesk-web/.next/standalone ./

EXPOSE 3000
CMD ["node", "apps/picturesk-web/server.js"]
