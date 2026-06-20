FROM node:22-slim AS base
RUN npm install -g pnpm@9.15.0

# Chrome runtime libraries + fonts for Puppeteer (itinerary PDF/preview rendering).
# IMPORTANT: we run Puppeteer's OWN version-matched Chrome (downloaded in the deps
# stage), NOT a distro chromium. A mismatched/musl Chromium (e.g. Alpine's apk
# chromium) launches but never completes the CDP handshake — that surfaced as
# "Network.enable timed out". Debian + Puppeteer's pinned glibc Chrome is the
# officially supported, version-matched combination.
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates fonts-liberation \
    libasound2 libatk-bridge2.0-0 libatk1.0-0 libcairo2 libcups2 libdbus-1-3 \
    libexpat1 libfontconfig1 libgbm1 libglib2.0-0 libgtk-3-0 libnspr4 libnss3 \
    libpango-1.0-0 libpangocairo-1.0-0 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 \
    libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxkbcommon0 libxrandr2 \
    libxrender1 libxss1 libxtst6 \
    && rm -rf /var/lib/apt/lists/*

# Puppeteer downloads its pinned Chrome into this dir. It must be identical at build
# (install) and runtime, and it lives inside the image so the runner stage (which
# extends deps) inherits the browser. pdf.js leaves executablePath undefined, so
# Puppeteer auto-resolves the matched Chrome from here.
ENV PUPPETEER_CACHE_DIR=/repo/.cache/puppeteer

# ── Install dependencies (cached separately from source) ─────────────────────
FROM base AS deps
WORKDIR /repo

# Workspace manifests — copy these first for better layer caching
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./

# Every package the backend pulls in (direct + transitive workspace deps)
COPY packages/domains/auth/package.json            packages/domains/auth/package.json
COPY packages/domains/admin-users/package.json     packages/domains/admin-users/package.json
COPY packages/domains/affiliates/package.json      packages/domains/affiliates/package.json
COPY packages/domains/blog/package.json            packages/domains/blog/package.json
COPY packages/integrations/cloudinary/package.json      packages/integrations/cloudinary/package.json
COPY packages/domains/currencies/package.json      packages/domains/currencies/package.json
COPY packages/domains/flights/package.json         packages/domains/flights/package.json
COPY packages/integrations/airlabs/package.json    packages/integrations/airlabs/package.json
COPY packages/domains/locations/package.json       packages/domains/locations/package.json
COPY packages/domains/insurance/package.json       packages/domains/insurance/package.json
COPY packages/integrations/wis/package.json        packages/integrations/wis/package.json
COPY packages/shared/notifications/package.json   packages/shared/notifications/package.json
COPY packages/domains/payments/package.json        packages/domains/payments/package.json
COPY packages/domains/tickets/package.json         packages/domains/tickets/package.json
COPY packages/domains/itineraries/package.json     packages/domains/itineraries/package.json
COPY packages/domains/users/package.json           packages/domains/users/package.json
COPY packages/shared/utils/package.json           packages/shared/utils/package.json
COPY packages/domains/email-support/package.json   packages/domains/email-support/package.json
COPY packages/domains/visa/package.json            packages/domains/visa/package.json
COPY packages/domains/visa-leads/package.json      packages/domains/visa-leads/package.json
COPY apps/travl-backend/package.json       apps/travl-backend/package.json

RUN pnpm install --frozen-lockfile

# Download the Chrome build pinned by puppeteer (pnpm doesn't run puppeteer's
# postinstall browser download). Installs into PUPPETEER_CACHE_DIR; inherited by runner.
RUN pnpm --filter @travel-suite/itineraries exec puppeteer browsers install chrome

# ── Runtime image ────────────────────────────────────────────────────────────
FROM deps AS runner
WORKDIR /repo

# Copy all source
COPY packages/ packages/
COPY apps/travl-backend/ apps/travl-backend/

ENV NODE_ENV=production
ENV PORT=3001

EXPOSE 3001
WORKDIR /repo/apps/travl-backend
CMD ["node", "src/server.js"]
