import { FastifyRequest, } from 'fastify';
import { FromSchema } from 'json-schema-to-ts';
import { createPostInputSchema } from '@/schemas/utils';

// Character Names Schema
export const generateCharacterNamesRequestSchema = {
  type: 'object',
  properties: {
    count: { type: 'integer', minimum: 1, maximum: 200, default: 100, description: 'Number of character names to generate' },
    genre: { type: 'string', description: 'Genre of the setting (e.g., fantasy, sci-fi, western)', nullable: true },
    worldFeeling: { type: 'string', description: 'The feeling or atmosphere of the world (e.g., dark, whimsical, gritty)', nullable: true },
    nameStyles: { type: 'array', description: 'The styles of names to use', items: { type: 'string' }},
  },
  required: ['count']
} as const;

export const generateCharacterNamesResponseSchema = {
  type: 'object',
  properties: {
    names: { 
      type: 'array', 
      items: { type: 'string' },
      description: 'Array of generated character names'
    }
  },
  required: ['names']
} as const;

export const generateCharacterNamesInputSchema = createPostInputSchema(
  'Generate character names',
  generateCharacterNamesRequestSchema,
  generateCharacterNamesResponseSchema
);

export type GenerateCharacterNamesRequest = FastifyRequest<{
  Body: FromSchema<typeof generateCharacterNamesRequestSchema>
}>;

export type GenerateCharacterNamesOutput = FromSchema<typeof generateCharacterNamesResponseSchema>;