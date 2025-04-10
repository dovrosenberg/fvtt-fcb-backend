import { FastifySchema } from 'fastify';

/** note: on client side (using OpenAPI Generator) the tag becomes a whole class, so we're limiting to one per call */
export const createPostInputSchema = <
  RequestSchema extends Record<string, unknown>, 
  ResponseSchema extends Record<string, unknown>
> (description: string, bodySchema: RequestSchema, responseSchema: ResponseSchema): Readonly<FastifySchema> => {
  return {
    description: description,
    tags: ['FCB'],
    body: bodySchema,
    response: {
      200: responseSchema,
    }
  } as const;
};

export const createGetInputSchema = <
  ResponseSchema extends Record<string, unknown>
> (description: string, responseSchema: ResponseSchema): Readonly<FastifySchema> => {
  return {
    description: description,
    tags: ['FCB'],
    response: {
      200: responseSchema,
    }
  } as const;
};
