import { FastifyRequest, } from 'fastify';
import { FromSchema } from 'json-schema-to-ts';
import { createPostInputSchema } from '@/schemas/utils';
import { ImageModels, TextModels } from '@/services/models';

const generateOrganizationRequestSchema = {
  type: 'object',
  properties: {
    genre: { type: 'string', description: 'Genre of the world (ex. "fantasy" or "science fiction")' },
    rpgStyle: { type: 'boolean', description: 'Whether to create text suitable for reading to players (true) or a more narrative description (false).' },
    settingFeeling: { type: 'string', description: 'The feeling of the setting (ex. "humorous" or "apocalyptic")' },
    type: { type: 'string', description: 'The type of organization (ex. "family" or "cult")' },
    name: { type: 'string', description: 'The generated organization\'s name.  If blank, one will be generated (text gen only)' },
    briefDescription: { type: 'string', description: 'A brief description of the organization to factor into the produced text' },
    parentName: { type: 'string', description: 'The name of the parent organization' },
    parentType: { type: 'string', description: 'The type of parent organization' },
    parentDescription: { type: 'string', description: 'The current description of the organization\'s parent' },
    longDescriptionParagraphs: { type: 'integer', minimum: 1, maximum: 4, default: 1, description: 'The number of paragraphs to produce in the output when using a long description' },
    grandparentName: { type: 'string', description: 'The type of the grandparent organization' },
    grandparentType: { type: 'string', description: 'The type of grandparent organization' },
    grandparentDescription: { type: 'string', description: 'The current description of the organization\'s grandparent' },
    nameStyles: { type: 'array', description: 'The styles of names to use', items: { type: 'string' }},
    textModel: { type: 'string', enum: Object.values(TextModels), description: 'The text generation model to use' },
  },
  required: ['genre', 'rpgStyle'],
} as const;

// need to remove the rpgStyle property
const { rpgStyle: _rpgStyle, ...imageProperties } = generateOrganizationRequestSchema.properties;
export const generateOrganizationImageRequestSchema = {
  type: 'object',
  properties: {
    ...imageProperties,
    imageModel: { type: 'string', enum: Object.values(ImageModels), description: 'The image generation model to use' },
  },
  required: generateOrganizationRequestSchema.required.filter((prop) => prop !== 'rpgStyle'),
} as const; 

export const generateOrganizationResponseSchema = {
  type: 'object',
  properties: {
    name: { type: 'string', description: 'The generated organizations\'s name' },
    description: { 
      type: 'object',
      properties: {
        roleplayNotes: { type: 'string', description: 'Quick notes useful during game sessions' },
        long: { type: 'string', description: 'A long, detailed description of the organization.' }
      },
      required: ['roleplayNotes', 'long']
    }
  },
  required: ['name', 'description']
} as const;

export const generateOrganizationImageResponseSchema = {
  type: 'object',
  properties: {
    filePath: { type: 'string', description: 'The path of the new image' },
  },
  required: ['filePath']
} as const;

export const generateOrganizationInputSchema = createPostInputSchema(
  'Generate an organization', 
  generateOrganizationRequestSchema, 
  generateOrganizationResponseSchema
);
export const generateOrganizationImageInputSchema = createPostInputSchema(
  'Generate an organization image', 
  generateOrganizationImageRequestSchema, 
  generateOrganizationImageResponseSchema
);

export type GenerateOrganizationRequest = FastifyRequest<{ Body: FromSchema<typeof generateOrganizationRequestSchema> }>;
export type GenerateOrganizationImageRequest = FastifyRequest<{ Body: FromSchema<typeof generateOrganizationImageRequestSchema> }>;

export type GenerateOrganizationOutput = FromSchema<typeof generateOrganizationResponseSchema> ;
export type GenerateOrganizationImageOutput = FromSchema<typeof generateOrganizationImageResponseSchema> ;

