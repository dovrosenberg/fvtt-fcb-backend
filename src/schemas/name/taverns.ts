import { FastifyRequest, } from 'fastify';
import { FromSchema } from 'json-schema-to-ts';
import { createPostInputSchema } from '@/schemas/utils';

// Tavern Names Schema
export const generateTavernNamesRequestSchema = {
  type: 'object',
  properties: {
    count: { type: 'integer', minimum: 1, maximum: 200, default: 100, description: 'Number of tavern names to generate' },
    genre: { type: 'string', description: 'Genre of the setting (e.g., fantasy, sci-fi, western)', nullable: true },
    worldFeeling: { type: 'string', description: 'The feeling or atmosphere of the world (e.g., dark, whimsical, gritty)', nullable: true },
    nameStyles: { type: 'array', description: 'The styles of names to use', items: { type: 'string' }},
  },
  required: ['count']
} as const;

export const generateTavernNamesResponseSchema = {
  type: 'object',
  properties: {
    names: { 
      type: 'array', 
      items: { type: 'string' },
      description: 'Array of generated tavern names'
    }
  },
  required: ['names']
} as const;

export const generateTavernNamesInputSchema = createPostInputSchema(
  'Generate tavern names',
  generateTavernNamesRequestSchema,
  generateTavernNamesResponseSchema
);

export type GenerateTavernNamesRequest = FastifyRequest<{
  Body: FromSchema<typeof generateTavernNamesRequestSchema>
}>;

export type GenerateTavernNamesOutput = FromSchema<typeof generateTavernNamesResponseSchema>;