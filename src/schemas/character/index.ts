import { FastifyRequest, } from 'fastify';
import { FromSchema } from 'json-schema-to-ts';
import { createPostInputSchema } from '@/schemas/utils';

const generateCharacterRequestSchema = {
  type: 'object',
  properties: {
    genre: { type: 'string', description: 'Genre of the world (ex. "fantasy" or "science fiction")' },
    worldFeeling: { type: 'string', description: 'The feeling of the world (ex. "humorous" or "apocalyptic")' },
    type: { type: 'string', description: 'The type of character (ex. a trade or a title)' },
    species: { type: 'string', description: 'The species of the character' },
    speciesDescription: { type: 'string', description: 'A brief description of the species' },
    name: { type: 'string', description: 'The generated character\'s name.  If blank, one will be generated (text gen only)' },
    briefDescription: { type: 'string', description: 'A brief description of the character to factor into the produced text' }
  },
  required: ['genre'],
} as const;

const generateCharacterImageRequestSchema = generateCharacterRequestSchema;

export const generateCharacterResponseSchema = {
  type: 'object',
  properties: {
    name: { type: 'string', description: 'The generated character\'s name' },
    description: { type: 'string', description: 'A detailed description or the character' }
  },
  required: ['name', 'description']
} as const;

export const generateCharacterImageResponseSchema = {
  type: 'object',
  properties: {
    filePath: { type: 'string', description: 'The path of the new image' },
  },
  required: ['filePath']
} as const;

export const generateCharacterInputSchema = createPostInputSchema('Generate a character', generateCharacterRequestSchema, generateCharacterResponseSchema);
export const generateCharacterImageInputSchema = createPostInputSchema('Generate a character image', generateCharacterImageRequestSchema, generateCharacterImageResponseSchema);

export type GenerateCharacterRequest = FastifyRequest<{ Body: FromSchema<typeof generateCharacterRequestSchema> }>;
export type GenerateCharacterImageRequest = FastifyRequest<{ Body: FromSchema<typeof generateCharacterImageRequestSchema> }>;

export type GenerateCharacterOutput = FromSchema<typeof generateCharacterResponseSchema>;
export type GenerateCharacterImageOutput = FromSchema<typeof generateCharacterImageResponseSchema>;
