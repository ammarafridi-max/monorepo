FROM node:22-slim AS base
RUN npm install -g pnpm@9.15.0

# Itinerary rendering is now pure Node (@react-pdf/renderer + @napi-rs/canvas) —
# NO headless browser. @napi-rs/canvas ships a self-contained prebuilt binary, so
# we only need ca-certificates and a base font set. (This removed Chromium/Puppeteer
# and the entire "Network.enable timed out" failure class.)
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates fontconfig fonts-liberation \
    && rm -rf /var/lib/apt/lists/*

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
