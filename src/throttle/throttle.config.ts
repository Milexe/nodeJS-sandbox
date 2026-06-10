import type { ThrottlerModuleOptions } from '@nestjs/throttler';

/** Demo-friendly read limit: 5 GET requests per 5 seconds per IP. */
export const THROTTLE_READ_TTL_MS = 5_000;
export const THROTTLE_READ_LIMIT = 5;

export const THROTTLE_WRITE_TTL_MS = 60_000;
export const THROTTLE_WRITE_LIMIT = 20;

export const THROTTLE_AUTH_TTL_MS = 60_000;
export const THROTTLE_AUTH_LIMIT = 10;

export const throttlerConfig: ThrottlerModuleOptions = [
  {
    name: 'default',
    ttl: THROTTLE_READ_TTL_MS,
    limit: THROTTLE_READ_LIMIT,
  },
];

export const drinkWriteThrottle = {
  default: { limit: THROTTLE_WRITE_LIMIT, ttl: THROTTLE_WRITE_TTL_MS },
};

export const drinkImportThrottle = {
  default: { limit: 5, ttl: 10 * 60_000 },
};

export const authThrottle = {
  default: { limit: THROTTLE_AUTH_LIMIT, ttl: THROTTLE_AUTH_TTL_MS },
};

