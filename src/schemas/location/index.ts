import { FastifyRequest, } from 'fastify';
import { FromSchema } from 'json-schema-to-ts';
import { createPostInputSchema } from '@/schemas/utils';
import { ImageModels, TextModels } from '@/services/models';

const generateLocationRequestSchema = {
  type: 'object',
  properties: {
    genre: { type: 'string', description: 'Genre of the world (ex. "fantasy" or "science fiction")' },
    rpgStyle: { type: 'boolean', description: 'Whether to create text suitable for reading to players (true) or a more narrative description (false).' },
    settingFeeling: { type: 'string', description: 'The feeling of the setting (ex. "humorous" or "apocalyptic")' },
    type: { type: 'string', description: 'The type of location (ex. "town" or "kingdom" or "swamp")' },
    name: { type: 'string', description: 'The generated location\'s name.  If blank, one will be generated (text gen only)' },
    briefDescription: { type: 'string', description: 'A brief description of the location to factor into the produced text' },
    parentName: { type: 'string', description: 'The type of the parent location' },
    parentType: { type: 'string', description: 'The type of parent location' },
    parentDescription: { type: 'string', description: 'The current description of the location\'s parent' },
    grandparentName: { type: 'string', description: 'The type of the grandparent location' },
    grandparentType: { type: 'string', description: 'The type of grandparent location' },
    grandparentDescription: { type: 'string', description: 'The current description of the location\'s grandparent' },
    longDescriptionParagraphs: { type: 'integer', minimum: 1, maximum: 4, default: 1, description: 'The number of paragraphs to produce in the output when using a long description' },
    nameStyles: { type: 'array', description: 'The styles of names to use', items: { type: 'string' }},
    textModel: { type: 'string', enum: Object.values(TextModels), description: 'The text generation model to use' },
  },
  required: ['genre', 'rpgStyle'],
} as const;

export const generateLocationImageRequestSchema = {
  type: 'object',
  properties: {
    ...generateLocationRequestSchema.properties,
    imageModel: { type: 'string', enum: Object.values(ImageModels), description: 'The image generation model to use' },
  },
  required: generateLocationRequestSchema.required
} as const; 

export const generateLocationResponseSchema = {
  type: 'object',
  properties: {
    name: { type: 'string', description: 'The generated locations\'s name' },
    description: { 
      type: 'object',
      properties: {
        roleplayNotes: { type: 'string', description: 'Quick notes useful during game sessions' },
        long: { type: 'string', description: 'A long, detailed description of the location.' }
      },
      required: ['roleplayNotes', 'long']
    }
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
  'Generate a location', 
  generateLocationRequestSchema, 
  generateLocationResponseSchema
);
export const generateLocationImageInputSchema = createPostInputSchema(
  'Generate a location image', 
  generateLocationImageRequestSchema, 
  generateLocationImageResponseSchema
);

export type GenerateLocationRequest = FastifyRequest<{ Body: FromSchema<typeof generateLocationRequestSchema> }>;
export type GenerateLocationImageRequest = FastifyRequest<{ Body: FromSchema<typeof generateLocationImageRequestSchema> }>;

export type GenerateLocationOutput = FromSchema<typeof generateLocationResponseSchema> ;
export type GenerateLocationImageOutput = FromSchema<typeof generateLocationImageResponseSchema> ;
