import { FastifySchema } from 'fastify';

/** note: on client side (using OpenAPI Generator) the tag becomes a whole class, so we're limiting to one per call */
export const createInputSchema = <
  BodySchema extends Record<string, unknown>, 
  ResponseSchema extends Record<string, unknown>
> (description: string, bodySchema: BodySchema, responseSchema: ResponseSchema): Readonly<FastifySchema> => {
  return {
    description: description,
    tags: ['FCB'],
    body: bodySchema,
    response: {
      200: responseSchema,
    }
  } as const;
};
