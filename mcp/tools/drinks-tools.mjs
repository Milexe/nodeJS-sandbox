import { z } from 'zod';
import { SEED_DRINKS } from '../data/seed-drinks.mjs';

const MAX_LIMIT = 50;
const DEFAULT_LIMIT = 10;

const drinkFieldsSchema = {
  title: z.string().trim().min(1).max(40),
  description: z.string().optional(),
  abv: z.number().min(0).max(100),
  rating: z.number().min(0).max(5).optional(),
  price: z.number().min(0),
};

const createDrinkSchema = z.object({
  title: drinkFieldsSchema.title,
  description: drinkFieldsSchema.description,
  abv: drinkFieldsSchema.abv,
  rating: drinkFieldsSchema.rating,
  price: drinkFieldsSchema.price,
});

const updateDrinkSchema = z
  .object({
    id: z.number().int().positive(),
    title: drinkFieldsSchema.title.optional(),
    description: drinkFieldsSchema.description,
    abv: drinkFieldsSchema.abv.optional(),
    rating: drinkFieldsSchema.rating,
    price: drinkFieldsSchema.price.optional(),
  })
  .refine(
    (value) =>
      value.title !== undefined ||
      value.description !== undefined ||
      value.abv !== undefined ||
      value.rating !== undefined ||
      value.price !== undefined,
    { message: 'At least one field to update is required.' },
  );

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

function isUniqueViolation(error) {
  return error?.code === '23505';
}

async function findDrinkById(pool, id) {
  const result = await pool.query(
    `
      select id, title, description, abv, rating, price
      from "Drinks"
      where id = $1
    `,
    [id],
  );

  return result.rowCount === 0 ? null : result.rows[0];
}

async function assertTitleAvailable(pool, title, excludeId) {
  const params = [title];
  let sql = `
    select id
    from "Drinks"
    where title = $1
  `;

  if (excludeId !== undefined) {
    params.push(excludeId);
    sql += ` and id <> $2`;
  }

  const result = await pool.query(sql, params);
  return result.rowCount === 0;
}

export function registerDrinkTools(server, pool) {
  server.registerTool(
    'list_drinks',
    {
      title: 'List drinks',
      description: 'List drinks from the local application database.',
      inputSchema: {
        limit: z.number().int().min(1).max(MAX_LIMIT).default(DEFAULT_LIMIT),
        minRating: z.number().min(0).max(5).optional(),
      },
    },
    async ({ limit, minRating }) => {
      const params = [limit];
      const whereClauses = [];

      if (minRating !== undefined) {
        params.push(minRating);
        whereClauses.push(`rating >= $${params.length}`);
      }

      const whereSql =
        whereClauses.length > 0 ? `where ${whereClauses.join(' and ')}` : '';

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
      const row = await findDrinkById(pool, id);

      if (!row) {
        return toTextContent({ found: false, id });
      }

      return toTextContent({ found: true, drink: normalizeDrink(row) });
    },
  );

  server.registerTool(
    'drinks_stats',
    {
      title: 'Drinks stats',
      description:
        'Return aggregate statistics for drinks in the local application database.',
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

  server.registerTool(
    'create_drink',
    {
      title: 'Create drink',
      description:
        'Insert a new drink into the local application database. Title must be unique.',
      inputSchema: {
        title: drinkFieldsSchema.title,
        description: drinkFieldsSchema.description,
        abv: drinkFieldsSchema.abv,
        rating: drinkFieldsSchema.rating,
        price: drinkFieldsSchema.price,
      },
    },
    async (input) => {
      const data = createDrinkSchema.parse(input);

      const titleAvailable = await assertTitleAvailable(pool, data.title);
      if (!titleAvailable) {
        return toTextContent({
          created: false,
          error: 'Title already exists',
          title: data.title,
        });
      }

      try {
        const result = await pool.query(
          `
            insert into "Drinks" (title, description, abv, rating, price)
            values ($1, $2, $3, $4, $5)
            returning id, title, description, abv, rating, price
          `,
          [
            data.title,
            data.description ?? '',
            data.abv,
            data.rating ?? 0,
            data.price,
          ],
        );

        return toTextContent({
          created: true,
          drink: normalizeDrink(result.rows[0]),
        });
      } catch (error) {
        if (isUniqueViolation(error)) {
          return toTextContent({
            created: false,
            error: 'Title already exists',
            title: data.title,
          });
        }
        throw error;
      }
    },
  );

  server.registerTool(
    'update_drink',
    {
      title: 'Update drink',
      description:
        'Update an existing drink by id. Title must remain unique across other drinks.',
      inputSchema: {
        id: z.number().int().positive(),
        title: drinkFieldsSchema.title.optional(),
        description: drinkFieldsSchema.description,
        abv: drinkFieldsSchema.abv.optional(),
        rating: drinkFieldsSchema.rating,
        price: drinkFieldsSchema.price.optional(),
      },
    },
    async (input) => {
      const data = updateDrinkSchema.parse(input);
      const existing = await findDrinkById(pool, data.id);

      if (!existing) {
        return toTextContent({ updated: false, error: 'Drink not found', id: data.id });
      }

      const nextTitle = data.title ?? existing.title;
      if (data.title !== undefined) {
        const titleAvailable = await assertTitleAvailable(pool, nextTitle, data.id);
        if (!titleAvailable) {
          return toTextContent({
            updated: false,
            error: 'Title already exists',
            title: nextTitle,
          });
        }
      }

      const nextDescription =
        data.description !== undefined ? data.description : existing.description;
      const nextAbv = data.abv !== undefined ? data.abv : existing.abv;
      const nextRating = data.rating !== undefined ? data.rating : existing.rating;
      const nextPrice = data.price !== undefined ? data.price : existing.price;

      try {
        const result = await pool.query(
          `
            update "Drinks"
            set title = $2,
                description = $3,
                abv = $4,
                rating = $5,
                price = $6
            where id = $1
            returning id, title, description, abv, rating, price
          `,
          [data.id, nextTitle, nextDescription, nextAbv, nextRating, nextPrice],
        );

        return toTextContent({
          updated: true,
          drink: normalizeDrink(result.rows[0]),
        });
      } catch (error) {
        if (isUniqueViolation(error)) {
          return toTextContent({
            updated: false,
            error: 'Title already exists',
            title: nextTitle,
          });
        }
        throw error;
      }
    },
  );

  server.registerTool(
    'delete_drink',
    {
      title: 'Delete drink',
      description: 'Delete a drink by id from the local application database.',
      inputSchema: {
        id: z.number().int().positive(),
      },
    },
    async ({ id }) => {
      const result = await pool.query(
        `
          delete from "Drinks"
          where id = $1
          returning id, title
        `,
        [id],
      );

      if (result.rowCount === 0) {
        return toTextContent({ deleted: false, id });
      }

      return toTextContent({
        deleted: true,
        drink: {
          id: Number(result.rows[0].id),
          title: result.rows[0].title,
        },
      });
    },
  );

  server.registerTool(
    'seed_drinks',
    {
      title: 'Seed drinks',
      description:
        'Insert the built-in demo drink catalog. Existing titles are skipped.',
      inputSchema: {},
    },
    async () => {
      let inserted = 0;
      let skipped = 0;
      const insertedTitles = [];
      const skippedTitles = [];

      for (const drink of SEED_DRINKS) {
        const result = await pool.query(
          `
            insert into "Drinks" (title, description, abv, rating, price)
            values ($1, $2, $3, $4, $5)
            on conflict (title) do nothing
            returning id
          `,
          [drink.title, drink.description, drink.abv, drink.rating, drink.price],
        );

        if (result.rowCount === 0) {
          skipped += 1;
          skippedTitles.push(drink.title);
        } else {
          inserted += 1;
          insertedTitles.push(drink.title);
        }
      }

      const countResult = await pool.query(`select count(*)::int as count from "Drinks"`);
      const total = countResult.rows[0].count;

      return toTextContent({
        seeded: true,
        inserted,
        skipped,
        total,
        insertedTitles,
        skippedTitles,
      });
    },
  );
}
