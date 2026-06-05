# NodeJS Sandbox

**by Roman** · NestJS · React · PostgreSQL

Portfolio sandbox for backend patterns, API demos, and full-stack experiments. Each demo is a focused slice of the stack — pick one from the UI and explore.

**Live app:** [https://node-js-sandbox.vercel.app/](https://node-js-sandbox.vercel.app/)

> Hosted on free tiers (Vercel, Render, Neon). The first API request after idle may take up to a minute.

## Demos

| Demo | Status | Highlights |
|------|--------|------------|
| REST API, CORS & Database | **Live** | Drinks CRUD at `/drink`, Prisma, PostgreSQL, DTO validation, CORS; file upload & CSV import planned |
| Server-side API Proxy | Planned | Nest forwards client requests to external APIs via `/gif` |
| JWT Authentication & Roles | Planned | Login, refresh tokens, guards, role-based access |
| WebSockets & Real-time | Planned | Nest WebSocket gateway, rooms, push updates |
| OpenAPI & Swagger | Planned | Interactive docs from controllers and DTOs |
| Health Checks & Rate Limiting | Planned | Liveness/readiness probes, throttling, `429` responses |

## Stack

- **Backend:** NestJS, TypeScript, Prisma, PostgreSQL, class-validator, JWT (planned)
- **Frontend:** React, Vite, React Router
- **Data:** PostgreSQL on Neon (production), Docker Compose (local dev)
- **Deploy:** Vercel (SPA), Render (API), Neon (database)

## Project structure

```
src/           NestJS API
frontend/      React SPA (Vite)
prisma/        Schema and migrations
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
- `CORS_ORIGIN` — allowed frontend origins (comma-separated)
- `VITE_API_URL` — API base URL baked into the frontend build

## Deployment

| Layer | Platform | Role |
|-------|----------|------|
| Frontend | [Vercel](https://vercel.com) | React SPA, SPA routing via `vercel.json` rewrites |
| API | [Render](https://render.com) | NestJS REST API (`/drink`, …) |
| Database | [Neon](https://neon.tech) | Serverless PostgreSQL |

**Live frontend:** [https://node-js-sandbox.vercel.app/](https://node-js-sandbox.vercel.app/)

**Live API:** [https://nodejs-sandbox-z8j8.onrender.com](https://nodejs-sandbox-z8j8.onrender.com)

## Author

- GitHub: [@Milexe](https://github.com/Milexe)
- LinkedIn: [Roman Savin](https://www.linkedin.com/in/roman-savin-06b928400/)
- Telegram: [@Miwexe](https://t.me/Miwexe)
- Email: milexeuwu@gmail.com
