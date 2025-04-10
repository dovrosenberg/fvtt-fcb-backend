import { FastifyRequest, } from 'fastify';
import { FromSchema } from 'json-schema-to-ts';
import { createPostInputSchema } from '@/schemas/utils';

const generateLocationRequestSchema = {
  type: 'object',
  properties: {
    genre: { type: 'string', description: 'Genre of the world (ex. "fantasy" or "science fiction")' },
    worldFeeling: { type: 'string', description: 'The feeling of the world (ex. "humorous" or "apocalyptic")' },
    type: { type: 'string', description: 'The type of location (ex. "town" or "kingdom" or "swamp")' },
    name: { type: 'string', description: 'The generated location\'s name.  If blank, one will be generated (text gen only)' },
    briefDescription: { type: 'string', description: 'A brief description of the location to factor into the produced text' },
    parentName: { type: 'string', description: 'The type of the parent location' },
    parentType: { type: 'string', description: 'The type of parent location' },
    parentDescription: { type: 'string', description: 'The current description of the location\'s parent' },
    grandparentName: { type: 'string', description: 'The type of the grandparent location' },
    grandparentType: { type: 'string', description: 'The type of grandparent location' },
    grandparentDescription: { type: 'string', description: 'The current description of the location\'s grandparent' },
  },
  required: ['genre'],
} as const;

export const generateLocationImageRequestSchema = generateLocationRequestSchema; 

export const generateLocationResponseSchema = {
  type: 'object',
  properties: {
    name: { type: 'string', description: 'The generated locations\'s name' },
    description: { type: 'string', description: 'A detailed description or the location' }
  },
  required: ['name', 'description']
} as const;

export const generateLocationImageResponseSchema = {
  type: 'object',
  properties: {
    filePath: { type: 'string', description: 'The path of the new image' },
  },
  required: ['filePath']
} as const;

export const generateLocationInputSchema = createPostInputSchema(
  'Generate an location', 
  generateLocationRequestSchema, 
  generateLocationResponseSchema
);
export const generateLocationImageInputSchema = createPostInputSchema(
  'Generate an location image', 
  generateLocationImageRequestSchema, 
  generateLocationImageResponseSchema
);

export type GenerateLocationRequest = FastifyRequest<{ Body: FromSchema<typeof generateLocationRequestSchema> }>;
export type GenerateLocationImageRequest = FastifyRequest<{ Body: FromSchema<typeof generateLocationImageRequestSchema> }>;

export type GenerateLocationOutput = FromSchema<typeof generateLocationResponseSchema> ;
export type GenerateLocationImageOutput = FromSchema<typeof generateLocationImageResponseSchema> ;
