# NodeJS Sandbox — Project Overview

Portfolio sandbox demonstrating backend patterns, REST API design, and full-stack integration.

## Stack

**Backend** — `src/`
- NestJS + TypeScript
- Prisma ORM + PostgreSQL
- JWT auth (access + refresh tokens)
- class-validator, @nestjs/throttler
- @nestjs/swagger (Swagger UI at `/api/docs`, enabled via `SWAGGER_ENABLED=true`)

**Frontend** — `frontend/`
- React + TypeScript + Vite
- React Router

**MCP Server** — `mcp/`
- Custom MCP server (`app-server.mjs`) with tools for drinks and auth data
- Two modes: `readwrite` (local) and `readonly` (Neon/production)

## Running the Project

**Backend** (port 3000):
```bash
npm run start:dev
```

**Frontend** (port 5173):
```bash
cd frontend && npm run dev
```

**MCP server** (local, for Claude):
```bash
npm run mcp:app
```

## Key Environment Variables (`.env`)

```
PORT=3000
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/app
CORS_ORIGIN=http://localhost:5173
JWT_ACCESS_EXPIRES_IN=900
JWT_REFRESH_EXPIRES_IN=604800
```

## Project Structure

```
src/
  auth/          # JWT auth — login, refresh, guards, decorators
  drink/         # Drinks CRUD — controller, service, DTO, CSV import, image upload
  users/         # Users module
  health/        # GET /health liveness probe
  gif/           # External API proxy (Giphy)
  prisma/        # PrismaService
  throttle/      # Rate limiting config

frontend/
  src/
    pages/       # HomePage, DrinksListPage, DrinkDetailPage, GifPage
    components/  # AppHeader, DrinkFormModal, DrinksCatalogControls, etc.
    api/         # API client functions
    hooks/       # React hooks

mcp/
  app-server.mjs          # MCP server entrypoint
  tools/
    drinks-tools.mjs      # Drink CRUD tools
    auth-read-tools.mjs   # User/token read tools
    drinks-resources.mjs  # MCP resources
    drinks-prompts.mjs    # MCP prompts

prisma/
  schema.prisma    # DB schema
  migrations/      # Migration history
  seed-drinks.sql  # Seed data

.claude/
  settings.json    # MCP servers + hooks config
  hooks/
    log-tool.mjs   # PreToolUse hook — logs every tool call
```

## Conventions

### DTOs
- Every field in a request DTO must have `@ApiProperty()` or `@ApiPropertyOptional()` from `@nestjs/swagger`.
- Use `@ApiProperty({ example: ..., minimum: ..., maximum: ..., maxLength: ... })` — populate all constraints that exist on the field.
- For enums/`@IsIn()` fields: pass `enum: ARRAY_CONSTANT` so Swagger renders a dropdown.
- In `PartialType`-based update DTOs: import `PartialType` from `@nestjs/swagger`, not `@nestjs/mapped-types` — otherwise Swagger metadata is lost.
- Internal DTOs not used in HTTP endpoints (e.g. CSV row parsers) are exempt.

## Database

Local: `postgresql://postgres:postgres@localhost:5432/app`
Production: Neon (PostgreSQL serverless, configured via `DATABASE_URL` env)

```bash
# Apply migrations
npm run prisma:migrate

# Regenerate Prisma client
npm run prisma:generate

# Start local DB (Docker)
npm run db:up
```
