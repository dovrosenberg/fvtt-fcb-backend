import { FastifyRequest, } from 'fastify';
import { FromSchema } from 'json-schema-to-ts';
import { createPostInputSchema } from '@/schemas/utils';

// Character Names Schema
export const generateTownNamesRequestSchema = {
  type: 'object',
  properties: {
    count: { type: 'integer', minimum: 1, maximum: 200, default: 100, description: 'Number of town names to generate' },
    genre: { type: 'string', description: 'Genre of the setting (e.g., fantasy, sci-fi, western)', nullable: true },
    settingFeeling: { type: 'string', description: 'The feeling or atmosphere of the world (e.g., dark, whimsical, gritty)', nullable: true },
    nameStyles: { type: 'array', description: 'The styles of names to use', items: { type: 'string' }},
    model: { type: 'number', description: 'The text generation model to use' },
  },
  required: ['count']
} as const;

export const generateTownNamesResponseSchema = {
  type: 'object',
  properties: {
    names: { 
      type: 'array', 
      items: { type: 'string' },
      description: 'Array of generated town names'
    }
  },
  required: ['names']
} as const;

export const generateTownNamesInputSchema = createPostInputSchema(
  'Generate town names',
  generateTownNamesRequestSchema,
  generateTownNamesResponseSchema
);

export type GenerateTownNamesRequest = FastifyRequest<{
  Body: FromSchema<typeof generateTownNamesRequestSchema>
}>;

export type GenerateTownNamesOutput = FromSchema<typeof generateTownNamesResponseSchema>;

