const DRINK_SCHEMA = {
  model: 'Drink',
  table: 'Drinks',
  fields: [
    { name: 'id', type: 'Int', description: 'Primary key' },
    { name: 'title', type: 'String', maxLength: 40, description: 'Drink name' },
    { name: 'description', type: 'Text', description: 'Full description' },
    { name: 'abv', type: 'Decimal(5,2)', description: 'Alcohol by volume percent' },
    { name: 'rating', type: 'SmallInt', description: 'Rating from 0 to 10' },
    { name: 'price', type: 'Decimal(10,2)', description: 'Price in app currency' },
  ],
};

export function registerDrinkResources(server, pool) {
  server.registerResource(
    'drink-schema',
    'drink://schema',
    {
      title: 'Drink schema',
      description: 'Static schema for the Drink entity used by this application.',
      mimeType: 'application/json',
    },
    async () => ({
      contents: [
        {
          uri: 'drink://schema',
          mimeType: 'application/json',
          text: JSON.stringify(DRINK_SCHEMA, null, 2),
        },
      ],
    }),
  );

  server.registerResource(
    'drink-stats-snapshot',
    'drink://stats',
    {
      title: 'Drinks statistics snapshot',
      description: 'Current aggregate statistics from the Drinks table.',
      mimeType: 'application/json',
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

      return {
        contents: [
          {
            uri: 'drink://stats',
            mimeType: 'application/json',
            text: JSON.stringify(result.rows[0], null, 2),
          },
        ],
      };
    },
  );
}
