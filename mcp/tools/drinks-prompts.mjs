import { z } from 'zod';

export function registerDrinkPrompts(server) {
  server.registerPrompt(
    'describe_drink',
    {
      title: 'Describe drink',
      description:
        'Generate a short marketing description for a drink from abv, price, and optional details.',
      argsSchema: {
        abv: z.number().min(0).max(100),
        price: z.number().min(0),
        title: z.string().max(40).optional(),
        rating: z.number().int().min(0).max(10).optional(),
      },
    },
    async ({ abv, price, title, rating }) => {
      const name = title ?? 'this drink';
      const ratingLine =
        rating !== undefined ? ` It has a rating of ${rating}/10.` : '';

      return {
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: [
                `Write a concise marketing description (2-3 sentences) for ${name}.`,
                `ABV: ${abv}%. Price: ${price}.${ratingLine}`,
                'Tone: friendly, suitable for a drinks catalog. Do not invent facts beyond these inputs.',
              ].join(' '),
            },
          },
        ],
      };
    },
  );

  server.registerPrompt(
    'compare_drinks_criteria',
    {
      title: 'Compare drinks criteria',
      description:
        'Ask the model to compare drinks using app-local tools and explain trade-offs.',
      argsSchema: {
        focus: z.enum(['price', 'rating', 'abv']).default('rating'),
      },
    },
    async ({ focus }) => {
      return {
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: [
                `Use app-local MCP tools to inspect drinks in the database.`,
                `Compare options prioritizing ${focus}.`,
                `Call list_drinks and drinks_stats if helpful.`,
                `Summarize top picks and trade-offs in a short table.`,
              ].join(' '),
            },
          },
        ],
      };
    },
  );
}
