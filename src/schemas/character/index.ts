import { FastifyRequest, FastifySchema } from 'fastify';
import { FromSchema } from 'json-schema-to-ts'

const generateCharacterBodySchema = {
  type: 'object',
  properties: {
    genre: { type: 'string', description: 'Genre of the world (ex. "fantasy" or "science fiction")' },
    name: { type: 'string', description: '' }
  },
  required: ['genre']    
} as const;

export const generateCharacterInputSchema: FastifySchema = {
  description: '',
  tags: ['character', 'gpt'],
  body: generateCharacterBodySchema
} as const;

export type GenerateCharacterRequest = FastifyRequest<{ Body: FromSchema<typeof generateCharacterBodySchema> }>;

// interface GenerateCharacterInput {
//   genre: string | null;
//   worldFeeling: string | null;
//   type: string | null;
//   species: string | null;
//   briefDescription: string | null;
// }

// interface GenerateCharacterOutput {
//   character: {
//     name: string,
//     description: string,
//   }
// }
