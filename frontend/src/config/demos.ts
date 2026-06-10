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
      'Drinks catalog — CRUD, search/sort/filters, image upload, CSV import, 1000-drink cap, and request throttling',
    path: '/drinks',
    available: true,
  },
  {
    id: 'gif',
    title: 'External API Proxy & Secret Handling',
    summary:
      'ArtSearch artwork search via Nest — hides API key, validates queries, maps upstream errors and quota',
    path: '/gif',
    available: true,
  },
  {
    id: 'auth',
    title: 'JWT Authentication & Roles',
    summary:
      'Login, refresh tokens, guards, role-based access, and auth route rate limits',
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
]

export function findActiveDemo(pathname: string): Demo | undefined {
  return demos.find(
    (demo) => pathname === demo.path || pathname.startsWith(`${demo.path}/`),
  )
}
