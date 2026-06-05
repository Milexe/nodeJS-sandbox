export type Demo = {
  id: string
  title: string
  summary: string
  path: string
  available: boolean
}

export const demos: Demo[] = [
  {
    id: 'drinks',
    title: 'REST API, CORS & Database',
    summary:
      'Drinks catalog over /drink — Prisma, PostgreSQL on Neon, CORS, file upload, and CSV import',
    path: '/drinks',
    available: true,
  },
  {
    id: 'gif',
    title: 'Server-side API Proxy',
    summary: 'Nest forwards client requests to external APIs through /gif',
    path: '/gif',
    available: false,
  },
  {
    id: 'auth',
    title: 'JWT Authentication & Roles',
    summary: 'Login, refresh tokens, guards, and role-based access control',
    path: '/auth',
    available: false,
  },
  {
    id: 'websockets',
    title: 'WebSockets & Real-time',
    summary: 'Nest WebSocket gateway — live events, rooms, and push updates without polling',
    path: '/ws',
    available: false,
  },
  {
    id: 'openapi',
    title: 'OpenAPI & Swagger',
    summary: 'Interactive API docs — schema and try-it-out UI generated from Nest controllers and DTOs',
    path: '/docs',
    available: false,
  },
  {
    id: 'ops',
    title: 'Health Checks & Rate Limiting',
    summary: 'Liveness and readiness probes, dependency status, and request throttling with 429 responses',
    path: '/ops',
    available: false,
  },
]

export function findActiveDemo(pathname: string): Demo | undefined {
  return demos.find(
    (demo) => pathname === demo.path || pathname.startsWith(`${demo.path}/`),
  )
}
