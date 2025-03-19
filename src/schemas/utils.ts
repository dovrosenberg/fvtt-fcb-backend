import { FastifySchema } from 'fastify';

export const createInputSchema = <
  BodySchema extends Record<string, unknown>, 
  ResponseSchema extends Record<string, unknown>
> (description: string, tags: string[], bodySchema: BodySchema, responseSchema: ResponseSchema): Readonly<FastifySchema> => {
  return {
    description: description,
    tags: tags,
    body: bodySchema,
    response: {
      200: responseSchema,
    }
  } as const;
};
