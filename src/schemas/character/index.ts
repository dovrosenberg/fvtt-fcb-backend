import { FastifyRequest, } from 'fastify';
import { FromSchema } from 'json-schema-to-ts';
import { createInputSchema } from '@/schemas/utils';

const generateCharacterBodySchema = {
  type: 'object',
  properties: {
    genre: { type: 'string', description: 'Genre of the world (ex. "fantasy" or "science fiction")' },
    worldFeeling: { type: 'string', description: 'The feeling of the world (ex. "humorous" or "apocalyptic")' },
    type: { type: 'string', description: 'The type of character (ex. a trade or a title)' },
    species: { type: 'string', description: 'The species of the character (will default to human)' },
    briefDescription: { type: 'string', description: 'A brief description of the character to factor into the produced text' }
  },
  required: ['genre'],
} as const;

export const generateCharacterResponseSchema = {
  type: 'object',
  properties: {
    name: { type: 'string', description: 'The generated character\'s name' },
    description: { type: 'string', description: 'A detailed description or the character' }
  },
  required: ['name', 'description']
} as const;

export const generateCharacterInputSchema = createInputSchema('Generate a character', ['character', 'gpt'], generateCharacterBodySchema, generateCharacterResponseSchema);

export type GenerateCharacterRequest = FastifyRequest<{ Body: FromSchema<typeof generateCharacterBodySchema> }>;
export type GenerateCharacterOutput = FromSchema<typeof generateCharacterResponseSchema>;

