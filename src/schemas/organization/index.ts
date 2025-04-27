import { FastifyRequest, } from 'fastify';
import { FromSchema } from 'json-schema-to-ts';
import { createPostInputSchema } from '@/schemas/utils';

const generateOrganizationRequestSchema = {
  type: 'object',
  properties: {
    genre: { type: 'string', description: 'Genre of the world (ex. "fantasy" or "science fiction")' },
    worldFeeling: { type: 'string', description: 'The feeling of the world (ex. "humorous" or "apocalyptic")' },
    type: { type: 'string', description: 'The type of organization (ex. "family" or "cult")' },
    name: { type: 'string', description: 'The generated organization\'s name.  If blank, one will be generated (text gen only)' },
    briefDescription: { type: 'string', description: 'A brief description of the organization to factor into the produced text' },
    parentName: { type: 'string', description: 'The type of the parent organization' },
    parentType: { type: 'string', description: 'The type of parent organization' },
    parentDescription: { type: 'string', description: 'The current description of the organization\'s parent' },
    createLongDescription: { type: 'boolean', description: 'Create a detailed description or a digestible summary'},
    grandparentName: { type: 'string', description: 'The type of the grandparent organization' },
    grandparentType: { type: 'string', description: 'The type of grandparent organization' },
    grandparentDescription: { type: 'string', description: 'The current description of the organization\'s grandparent' },
  },
  required: ['genre'],
} as const;

export const generateOrganizationImageRequestSchema = generateOrganizationRequestSchema; 

export const generateOrganizationResponseSchema = {
  type: 'object',
  properties: {
    name: { type: 'string', description: 'The generated organizations\'s name' },
    description: { type: 'string', description: 'A generated description of the organization' }
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

