import { z } from 'zod';

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;

function toTextContent(value) {
  return {
    content: [{ type: 'text', text: JSON.stringify(value, null, 2) }],
  };
}

function normalizeMessage(row) {
  return {
    id: Number(row.id),
    userId: Number(row.userId),
    text: row.text,
    createdAt: row.created_at,
  };
}

export function registerChatTools(server, pool) {
  server.tool(
    'list_messages',
    'List recent chat messages, newest last. Use limit to control how many to fetch.',
    {
      limit: z.number().int().min(1).max(MAX_LIMIT).optional().default(DEFAULT_LIMIT),
    },
    async ({ limit }) => {
      const { rows } = await pool.query(
        `SELECT id, "userId", text, created_at
           FROM messages
          ORDER BY created_at DESC
          LIMIT $1`,
        [limit],
      );
      return toTextContent(rows.reverse().map(normalizeMessage));
    },
  );

  server.tool(
    'create_message',
    'Create a chat message. userId must be 1 or 2. Optionally pass createdAt (ISO 8601) to set a custom timestamp.',
    {
      userId: z.number().int().min(1).max(2),
      text: z.string().trim().min(1).max(500),
      createdAt: z.string().datetime().optional(),
    },
    async ({ userId, text, createdAt }) => {
      const { rows } = createdAt
        ? await pool.query(
            `INSERT INTO messages ("userId", text, created_at) VALUES ($1, $2, $3) RETURNING id, "userId", text, created_at`,
            [userId, text, createdAt],
          )
        : await pool.query(
            `INSERT INTO messages ("userId", text) VALUES ($1, $2) RETURNING id, "userId", text, created_at`,
            [userId, text],
          );
      return toTextContent(normalizeMessage(rows[0]));
    },
  );

  server.tool(
    'delete_message',
    'Delete a chat message by id.',
    {
      id: z.number().int().positive(),
    },
    async ({ id }) => {
      const { rowCount } = await pool.query('DELETE FROM messages WHERE id = $1', [id]);
      return toTextContent({ deleted: rowCount > 0, id });
    },
  );

  server.tool(
    'clear_messages',
    'Delete all chat messages. Use for dev/demo resets only.',
    {},
    async () => {
      const { rowCount } = await pool.query('DELETE FROM messages');
      return toTextContent({ cleared: rowCount });
    },
  );
}
