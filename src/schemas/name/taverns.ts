import { FastifyRequest, } from 'fastify';
import { FromSchema } from 'json-schema-to-ts';
import { createPostInputSchema } from '@/schemas/utils';
import { TextModels } from '@/services/models';

// Tavern Names Schema
export const generateTavernNamesRequestSchema = {
  type: 'object',
  properties: {
    count: { type: 'integer', minimum: 1, maximum: 200, default: 100, description: 'Number of tavern names to generate' },
    genre: { type: 'string', description: 'Genre of the setting (e.g., fantasy, sci-fi, western)', nullable: true },
    settingFeeling: { type: 'string', description: 'The feeling or atmosphere of the world (e.g., dark, whimsical, gritty)', nullable: true },
    nameStyles: { type: 'array', description: 'The styles of names to use', items: { type: 'string' }},
    textModel: { type: 'string', enum: Object.values(TextModels), description: 'The text generation model to use' },
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