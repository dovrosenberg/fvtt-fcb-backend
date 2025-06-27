import { FastifyRequest, } from 'fastify';
import { FromSchema } from 'json-schema-to-ts';
import { createPostInputSchema } from '@/schemas/utils';
import { TextModels } from '@/services/models';

// Store Names Schema
export const generateStoreNamesRequestSchema = {
  type: 'object',
  properties: {
    count: { type: 'integer', minimum: 1, maximum: 200, default: 100, description: 'Number of store names to generate' },
    genre: { type: 'string', description: 'Genre of the setting (e.g., fantasy, sci-fi, western)', nullable: true },
    settingFeeling: { type: 'string', description: 'The feeling or atmosphere of the world (e.g., dark, whimsical, gritty)', nullable: true },
    storeType: { type: 'string', description: 'Type of store (e.g., blacksmith, apothecary, general store)', nullable: true },
    nameStyles: { type: 'array', description: 'The styles of names to use', items: { type: 'string' }},
    textModel: { type: 'string', enum: Object.values(TextModels), description: 'The text generation model to use' },
  },
  required: ['count']
} as const;

export const generateStoreNamesResponseSchema = {
  type: 'object',
  properties: {
    names: { 
      type: 'array', 
      items: { type: 'string' },
      description: 'Array of generated store names'
    }
  },
  required: ['names']
} as const;

export const generateStoreNamesInputSchema = createPostInputSchema(
  'Generate store names',
  generateStoreNamesRequestSchema,
  generateStoreNamesResponseSchema
);

export type GenerateStoreNamesRequest = FastifyRequest<{
  Body: FromSchema<typeof generateStoreNamesRequestSchema>
}>;

export type GenerateStoreNamesOutput = FromSchema<typeof generateStoreNamesResponseSchema>;