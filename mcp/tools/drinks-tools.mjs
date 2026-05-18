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

function normalizeDrink(row) {
  return {
    id: Number(row.id),
    title: row.title,
    description: row.description,
    abv: Number(row.abv),
    rating: Number(row.rating),
    price: Number(row.price),
  };
}

export function registerDrinkTools(server, pool) {
  server.registerTool(
    'list_drinks',
    {
      title: 'List drinks',
      description: 'List drinks from the local application database.',
      inputSchema: {
        limit: z.number().int().min(1).max(MAX_LIMIT).default(DEFAULT_LIMIT),
        minRating: z.number().int().min(0).max(10).optional(),
      },
    },
    async ({ limit, minRating }) => {
      const params = [limit];
      const whereClauses = [];

      if (minRating !== undefined) {
        params.push(minRating);
        whereClauses.push(`rating >= $${params.length}`);
      }

      const whereSql = whereClauses.length > 0 ? `where ${whereClauses.join(' and ')}` : '';

      const result = await pool.query(
        `
          select id, title, description, abv, rating, price
          from "Drinks"
          ${whereSql}
          order by id asc
          limit $1
        `,
        params,
      );

      return toTextContent(result.rows.map(normalizeDrink));
    },
  );

  server.registerTool(
    'get_drink',
    {
      title: 'Get drink',
      description: 'Get a single drink by id from the local application database.',
      inputSchema: {
        id: z.number().int().positive(),
      },
    },
    async ({ id }) => {
      const result = await pool.query(
        `
          select id, title, description, abv, rating, price
          from "Drinks"
          where id = $1
        `,
        [id],
      );

      if (result.rowCount === 0) {
        return toTextContent({ found: false, id });
      }

      return toTextContent({ found: true, drink: normalizeDrink(result.rows[0]) });
    },
  );

  server.registerTool(
    'drinks_stats',
    {
      title: 'Drinks stats',
      description: 'Return aggregate statistics for drinks in the local application database.',
      inputSchema: {},
    },
    async () => {
      const result = await pool.query(`
        select
          count(*)::int as count,
          coalesce(avg(abv), 0)::float as "averageAbv",
          coalesce(avg(price), 0)::float as "averagePrice",
          coalesce(avg(rating), 0)::float as "averageRating"
        from "Drinks"
      `);

      return toTextContent(result.rows[0]);
    },
  );
}
