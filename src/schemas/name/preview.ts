import { FastifyRequest, } from 'fastify';
import { FromSchema } from 'json-schema-to-ts';
import { createPostInputSchema } from '@/schemas/utils';

// Character Names Schema
export const generatePreviewNamesRequestSchema = {
  type: 'object',
  properties: {
    nameStyles: { type: 'array', items: { type: 'string' }, description: 'List of name styles to preview' },
    // temperature: { type: 'number', description: 'Temperature to use with GPT completion. Defaults to 0.9', nullable: true },
    genre: { type: 'string', description: 'Genre of the setting (e.g., fantasy, sci-fi, western)', nullable: true },
    settingFeeling: { type: 'string', description: 'The feeling or atmosphere of the world (e.g., dark, whimsical, gritty)', nullable: true },
  },
  required: ['nameStyles']
} as const;

export const generatePreviewNamesResponseSchema = {
  type: 'object',
  properties: {
    preview: { 
      type: 'array', 
      items: { 
        type: 'object', 
        properties: {
          people: { type: 'array', items: { type: 'string' }, description: 'Sample character names for this style' },
          locations: { type: 'array', items: { type: 'string' }, description: 'Sample location names for this style' }
        },
        description: 'The name previews for one name style',
      },
      description: 'Array of objects containing sample names corresponding to passed name styles'
    }
  },
  required: ['preview']
} as const;

export const generatePreviewNamesInputSchema = createPostInputSchema(
  'Generate preview of names for different namestyles',
  generatePreviewNamesRequestSchema,
  generatePreviewNamesResponseSchema
);

export type GeneratePreviewNamesRequest = FastifyRequest<{
  Body: FromSchema<typeof generatePreviewNamesRequestSchema>
}>;

export type GeneratePreviewNamesOutput = FromSchema<typeof generatePreviewNamesResponseSchema>;

