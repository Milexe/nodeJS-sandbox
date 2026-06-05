export type RateLimitRule = {
  id: string
  label: string
  limit: number
  windowLabel: string
  detail: string
  demoHint?: string
}

/** Keep in sync with src/throttle/throttle.config.ts */
export const RATE_LIMIT_RULES: RateLimitRule[] = [
  {
    id: 'read',
    label: 'Read (GET)',
    limit: 5,
    windowLabel: '5 seconds',
    detail: 'Catalog list, drink details, and other GET endpoints',
    demoHint:
      'Spam F5 (refresh) on this page — after 5 loads within 5 seconds you should see an error instead of the catalog.',
  },
  {
    id: 'write',
    label: 'Write (POST, PATCH, DELETE)',
    limit: 20,
    windowLabel: '1 minute',
    detail: 'Create, update, delete drinks, and image uploads',
  },
  {
    id: 'auth',
    label: 'Auth',
    limit: 10,
    windowLabel: '1 minute',
    detail: 'Login, register, refresh, and logout',
  },
]

export const RATE_LIMITS_FOOTNOTE =
  'Rate limits apply to this API. Excess traffic receives HTTP 429.'
