import { FastifyRequest, } from 'fastify';
import { FromSchema } from 'json-schema-to-ts';
import { createInputSchema } from '@/schemas/utils';

const generateOrganizationBodySchema = {
  type: 'object',
  properties: {
    genre: { type: 'string', description: 'Genre of the world (ex. "fantasy" or "science fiction")' },
    worldFeeling: { type: 'string', description: 'The feeling of the world (ex. "humorous" or "apocalyptic")' },
    type: { type: 'string', description: 'The type of organization (ex. "family" or "cult")' },
    briefDescription: { type: 'string', description: 'A brief description of the organization to factor into the produced text' },
    parentName: { type: 'string', description: 'The type of the parent organization' },
    parentType: { type: 'string', description: 'The type of parent organization' },
    parentDescription: { type: 'string', description: 'The current description of the organization\'s parent' },
  },
  required: ['genre'],
} as const;

export const generateOrganizationResponseSchema = {
  type: 'object',
  properties: {
    name: { type: 'string', description: 'The generated organizations\'s name' },
    description: { type: 'string', description: 'A detailed description or the organization' }
  },
  required: ['name', 'description']
} as const;

export const generateOrganizationInputSchema = createInputSchema('Generate an organization', generateOrganizationBodySchema, generateOrganizationResponseSchema);

export type GenerateOrganizationRequest = FastifyRequest<{ Body: FromSchema<typeof generateOrganizationBodySchema> }>;
export type GenerateOrganizationOutput = FromSchema<typeof generateOrganizationResponseSchema> ;

