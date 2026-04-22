# Travel Suite — Multi-Brand Travel SaaS Monorepo

This monorepo contains four travel brands: **MDT**, **DT365**, **TravelShield**, and **Travl**. Each brand has its own Next.js frontend and Express 5 backend. Shared business logic lives in the `packages/` directory and is consumed by apps via workspace references.

## Folder Structure

```
/
├── apps/
│   ├── mdt-frontend/          # MDT — Next.js frontend
│   ├── mdt-backend/           # MDT — Express 5 + MongoDB backend
│   ├── dt365-frontend/        # DT365 — Next.js frontend
│   ├── dt365-backend/         # DT365 — Express 5 + MongoDB backend
│   ├── travelshield-frontend/ # TravelShield — Next.js frontend
│   ├── travelshield-backend/  # TravelShield — Express 5 + MongoDB backend
│   ├── travl-frontend/        # Travl — Next.js frontend
│   └── travl-backend/         # Travl — Express 5 + MongoDB backend
├── packages/
│   ├── config/                # Brand config resolved from BRAND env var
│   ├── auth/                  # Shared auth (JWT, sessions)
│   ├── users/                 # User domain logic
│   ├── admin-users/           # Admin user domain logic
│   ├── insurance/             # Insurance domain logic
│   ├── payments/              # Payment processing logic
│   ├── notifications/         # Email / SMS / push notifications
│   ├── tickets/               # Support ticket logic
│   └── utils/                 # Shared utilities and helpers
├── .nvmrc                     # Node 22 LTS
├── turbo.json
├── pnpm-workspace.yaml
└── package.json
```

## Prerequisites

- Node 22 LTS (`nvm use`)
- pnpm 9 (`npm i -g pnpm@9`)

## Install

```bash
pnpm install
```

## Development

Run a single app:

```bash
pnpm turbo dev --filter=travelshield-frontend
```

Run an app and all its dependent packages in watch mode:

```bash
pnpm turbo dev --filter=travelshield-backend...
```

## Build

Build everything:

```bash
pnpm turbo build
```

Build a single app:

```bash
pnpm turbo build --filter=mdt-frontend
```

## Adding Dependencies

Add a dependency to a specific workspace:

```bash
pnpm add <pkg> --filter=<workspace-name>
```

Examples:

```bash
pnpm add express --filter=travelshield-backend
pnpm add next react react-dom --filter=travelshield-frontend
```

## Brand Configuration

Each brand's runtime settings (name, logo URL, theme colours, feature flags) are resolved from `@travel-suite/config` using the `BRAND` environment variable. Set `BRAND=mdt`, `BRAND=dt365`, `BRAND=travelshield`, or `BRAND=travl` in each app's environment before starting.
