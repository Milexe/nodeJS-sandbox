export type Demo = {
  id: string
  title: string
  summary: string
  path: string
  available: boolean
  external?: boolean
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
    summary: 'Two-user chat via Nest WebSocket gateway — real-time broadcast, typing indicator, and message history',
    path: '/ws/1',
    available: true,
  },
  {
    id: 'openapi',
    title: 'OpenAPI & Swagger',
    summary: 'Interactive API docs — schema and try-it-out UI generated from Nest controllers and DTOs',
    path: '/api/docs',
    available: true,
    external: true,
  },
]

export function findActiveDemo(pathname: string): Demo | undefined {
  return demos.find((demo) => {
    const base = demo.id === 'websockets' ? '/ws' : demo.path
    return pathname === base || pathname.startsWith(`${base}/`)
  })
}
