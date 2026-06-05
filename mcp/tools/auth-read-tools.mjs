import { z } from 'zod';

const MAX_LIMIT = 50;
const DEFAULT_LIMIT = 10;

function toTextContent(value) {
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(value, null, 2),
      },
    ],
  };
}

function normalizeUser(row) {
  return {
    id: row.id,
    email: row.email,
    role: row.role,
    createdAt: row.created_at,
  };
}

function normalizeRefreshToken(row) {
  return {
    id: row.id,
    userId: row.user_id,
    expiresAt: row.expires_at,
    createdAt: row.created_at,
  };
}

export function registerAuthReadTools(server, pool, scopeLabel) {
  server.registerTool(
    'list_users',
    {
      title: 'List users',
      description: `List users from ${scopeLabel}. Never returns password hashes.`,
      inputSchema: {
        limit: z.number().int().min(1).max(MAX_LIMIT).default(DEFAULT_LIMIT),
      },
    },
    async ({ limit }) => {
      const result = await pool.query(
        `
          select id, email, role, created_at
          from users
          order by created_at desc
          limit $1
        `,
        [limit],
      );

      return toTextContent(result.rows.map(normalizeUser));
    },
  );

  server.registerTool(
    'get_user',
    {
      title: 'Get user',
      description: `Get a user by id from ${scopeLabel}. Never returns password hashes.`,
      inputSchema: {
        id: z.string().uuid(),
      },
    },
    async ({ id }) => {
      const result = await pool.query(
        `
          select id, email, role, created_at
          from users
          where id = $1
        `,
        [id],
      );

      if (result.rowCount === 0) {
        return toTextContent({ found: false, id });
      }

      return toTextContent({ found: true, user: normalizeUser(result.rows[0]) });
    },
  );

  server.registerTool(
    'list_refresh_tokens',
    {
      title: 'List refresh tokens',
      description: `List refresh token metadata from ${scopeLabel}. Never returns token values.`,
      inputSchema: {
        limit: z.number().int().min(1).max(MAX_LIMIT).default(DEFAULT_LIMIT),
        userId: z.string().uuid().optional(),
      },
    },
    async ({ limit, userId }) => {
      const params = [limit];
      let sql = `
        select id, user_id, expires_at, created_at
        from refresh_tokens
      `;

      if (userId !== undefined) {
        params.unshift(userId);
        sql += ` where user_id = $1 order by created_at desc limit $2`;
      } else {
        sql += ` order by created_at desc limit $1`;
      }

      const result = await pool.query(sql, params);
      return toTextContent(result.rows.map(normalizeRefreshToken));
    },
  );

  server.registerTool(
    'get_refresh_token',
    {
      title: 'Get refresh token',
      description: `Get refresh token metadata by id from ${scopeLabel}. Never returns token values.`,
      inputSchema: {
        id: z.string().uuid(),
      },
    },
    async ({ id }) => {
      const result = await pool.query(
        `
          select id, user_id, expires_at, created_at
          from refresh_tokens
          where id = $1
        `,
        [id],
      );

      if (result.rowCount === 0) {
        return toTextContent({ found: false, id });
      }

      return toTextContent({
        found: true,
        refreshToken: normalizeRefreshToken(result.rows[0]),
      });
    },
  );
}
