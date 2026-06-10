/**
 * CORS_ORIGIN — comma-separated allowed origins (prod + local).
 * CORS_ALLOW_VERCEL_PREVIEW=true — also allow https://*.vercel.app (PR preview URLs).
 */
export function createCorsOriginValidator():
  | boolean
  | string
  | string[]
  | ((
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void,
    ) => void) {
  const allowed = [
    ...(process.env.CORS_ORIGIN ?? 'http://localhost:5173')
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean),
    // Allow Swagger UI requests from the API's own origin (same host, different path)
    `http://localhost:${process.env.PORT ?? 3000}`,
  ];

  const allowVercelPreview = process.env.CORS_ALLOW_VERCEL_PREVIEW === 'true';

  const vercelPreviewPattern = /^https:\/\/[\w.-]+\.vercel\.app$/;

  return (
    origin: string | undefined,
    callback: (err: Error | null, allow?: boolean) => void,
  ) => {
    if (!origin) {
      callback(null, true);
      return;
    }
    if (allowed.includes(origin)) {
      callback(null, true);
      return;
    }
    if (allowVercelPreview && vercelPreviewPattern.test(origin)) {
      callback(null, true);
      return;
    }
    callback(new Error('Not allowed by CORS'));
  };
}
