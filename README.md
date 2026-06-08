# NodeJS Sandbox

**by Roman** · NestJS · React · PostgreSQL

Portfolio sandbox for backend patterns, API demos, and full-stack experiments. Each demo is a focused slice of the stack — pick one from the UI and explore.

**Live app:** [https://node-js-sandbox.vercel.app/](https://node-js-sandbox.vercel.app/)

> Hosted on free tiers (Vercel, Render, Neon). The first API request after idle may take up to a minute.

## Demos

| Demo | Status | Highlights |
|------|--------|------------|
| REST API, CORS & Database | **Live** | Drinks catalog at `/drink` — CRUD, server-side search/sort/filters/pagination, image upload, CSV import, catalog cap (1000), `@nestjs/throttler` |
| External API Proxy & Secret Handling | **Live** | ArtSearch artwork search via Nest — hides API key, validates queries, maps upstream errors and quota (`GET /gif`) |
| JWT Authentication & Roles | Planned | Login, refresh tokens, guards, role-based access |
| WebSockets & Real-time | Planned | Nest WebSocket gateway, rooms, push updates |
| OpenAPI & Swagger | Planned | Interactive docs from controllers and DTOs |

## Stack

- **Backend:** NestJS, TypeScript, Prisma, PostgreSQL, class-validator, `@nestjs/throttler`, JWT (planned)
- **Frontend:** React, Vite, React Router
- **Data:** PostgreSQL on Neon (production), Docker Compose (local dev)
- **Deploy:** Vercel (SPA), Render (API), Neon (database)

## Project structure

```
src/           NestJS API
frontend/      React SPA (Vite)
prisma/        Schema and migrations
samples/       Committed static assets (CSV import example image)
mcp/           Local MCP tools for dev (optional)
```

## Quick start

### Prerequisites

- Node.js 20+
- Docker (for local PostgreSQL)

### API

```bash
npm install
cp .env.example .env
npm run db:up
npx prisma migrate deploy
npm run start:dev
```

API listens on `http://localhost:3000` by default.

### Frontend

```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:5173`. Set `VITE_API_URL=http://localhost:3000` in `frontend/.env.local`.

### Useful scripts

| Command | Description |
|---------|-------------|
| `npm run db:up` / `db:down` | Start/stop local Postgres |
| `npm run prisma:generate` | Regenerate Prisma client |
| `npm run test` | Unit tests |
| `npm run test:e2e` | E2E tests |

## Environment

See [`.env.example`](.env.example) (API) and [`frontend/.env.example`](frontend/.env.example) (SPA).

Key variables:

- `DATABASE_URL` — PostgreSQL connection string
- `ARTSEARCH_SECRET` — ArtSearch API key (server only; required for `/gif`)
- `CORS_ORIGIN` — allowed frontend origins (comma-separated)
- `VITE_API_URL` — API base URL baked into the frontend build at compile time

## Drinks catalog

SPA `/drinks`, API `/drink` — CRUD with multipart images, server-side search/sort/filters/pagination, CSV import (`POST /drink/import`, optional `imageUrl`), 1000-drink cap, and `@nestjs/throttler` on routes.

Images: uploads in `./uploads/` (max 2 MB; ephemeral on Render — redeploy clears files). Sample for CSV at `/samples/csv-import-example.png`. Missing files show a default placeholder in the UI.

## External API proxy (ArtSearch)

SPA `/gif`, API `GET /gif` — proxies the [ArtSearch](https://artsearch.io/) Search Artworks API. The browser never sees `ARTSEARCH_SECRET`; Nest validates query params via DTO (search text, type, material, technique, pagination), forwards the request with `x-api-key`, maps upstream errors (402 daily quota, 429 rate limit, timeouts), and surfaces quota from `X-Api-Quota-*` headers. Includes route logging middleware, throttling on GET routes, and client-side fallback data when the upstream is unavailable or the free-tier daily quota is exceeded (50 requests/day).

## Deployment

| Layer | Platform | Role |
|-------|----------|------|
| Frontend | [Vercel](https://vercel.com) | React SPA, SPA routing via `vercel.json` rewrites |
| API | [Render](https://render.com) | NestJS REST API (`/drink`, `/gif`, …) |
| Database | [Neon](https://neon.tech) | Serverless PostgreSQL |

**Live frontend:** [https://node-js-sandbox.vercel.app/](https://node-js-sandbox.vercel.app/)

**Live API:** [https://nodejs-sandbox-z8j8.onrender.com](https://nodejs-sandbox-z8j8.onrender.com)

## Author

- GitHub: [@Milexe](https://github.com/Milexe)
- LinkedIn: [Roman Savin](https://www.linkedin.com/in/roman-savin-06b928400/)
- Telegram: [@Miwexe](https://t.me/Miwexe)
- Email: milexeuwu@gmail.com
