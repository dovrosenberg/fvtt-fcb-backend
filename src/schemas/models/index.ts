import { FromSchema } from 'json-schema-to-ts';
import { ImageModels, TextModels } from '@/services/models';
import { createGetInputSchema } from '../utils';

const textModelsResponseSchema = {
  type: 'object',
  properties: {
    models: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', enum: Object.values(TextModels) },
          name: { type: 'string' },
          description: { type: 'string' },
        },
        required: ['id', 'name', 'description'],
      },
    },
  },
  required: ['models'],
} as const;

const imageModelsResponseSchema = {
  type: 'object',
  properties: {
    models: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', enum: Object.values(ImageModels) },
          name: { type: 'string' },
          description: { type: 'string' },
        },
        required: ['id', 'name', 'description'],
      },
    },
  },
  required: ['models'],
} as const;

export const textModelsInputSchema = createGetInputSchema(
  'Get the list of available text models',
  textModelsResponseSchema
);

export const imageModelsInputSchema = createGetInputSchema(
  'Get the list of available image models',
  imageModelsResponseSchema
);

export type TextModelsOutput = FromSchema<typeof textModelsResponseSchema>;
export type ImageModelsOutput = FromSchema<typeof imageModelsResponseSchema>;
