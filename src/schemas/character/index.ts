import { FastifyRequest, } from 'fastify';
import { FromSchema } from 'json-schema-to-ts';
import { createPostInputSchema } from '@/schemas/utils';

const generateCharacterBodySchema = {
  type: 'object',
  properties: {
    genre: { type: 'string', description: 'Genre of the world (ex. "fantasy" or "science fiction")' },
    worldFeeling: { type: 'string', description: 'The feeling of the world (ex. "humorous" or "apocalyptic")' },
    type: { type: 'string', description: 'The type of character (ex. a trade or a title)' },
    species: { type: 'string', description: 'The species of the character' },
    speciesDescription: { type: 'string', description: 'A brief description of the species' },
    name: { type: 'string', description: 'The generated character\'s name.  If blank, one will be generated' },
    briefDescription: { type: 'string', description: 'A brief description of the character to factor into the produced text' }
  },
  required: ['genre'],
} as const;

const generateCharacterImageBodySchema = {
  type: 'object',
  properties: {
    genre: { type: 'string', description: 'Genre of the world (ex. "fantasy" or "science fiction")' },
    worldFeeling: { type: 'string', description: 'The feeling of the world (ex. "humorous" or "apocalyptic")' },
    type: { type: 'string', description: 'The type of character (ex. a trade or a title)' },
    species: { type: 'string', description: 'The species of the character' },
    speciesDescription: { type: 'string', description: 'A brief description of the species' },
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

export const generateCharacterImageResponseSchema = {
  type: 'object',
  properties: {
    filePath: { type: 'string', description: 'The path of the new image' },
  },
  required: ['filePath']
} as const;

export const generateCharacterInputSchema = createPostInputSchema('Generate a character', generateCharacterBodySchema, generateCharacterResponseSchema);
export const generateCharacterImageInputSchema = createPostInputSchema('Generate a character', generateCharacterImageBodySchema, generateCharacterImageResponseSchema);

export type GenerateCharacterRequest = FastifyRequest<{ Body: FromSchema<typeof generateCharacterBodySchema> }>;
export type GenerateCharacterImageRequest = FastifyRequest<{ Body: FromSchema<typeof generateCharacterImageBodySchema> }>;

export type GenerateCharacterOutput = FromSchema<typeof generateCharacterResponseSchema>;
export type GenerateCharacterImageOutput = FromSchema<typeof generateCharacterImageResponseSchema>;
