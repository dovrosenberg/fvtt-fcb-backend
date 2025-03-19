import { FastifyRequest, } from 'fastify';
import { FromSchema } from 'json-schema-to-ts';
import { createInputSchema } from '@/schemas/utils';

const generateLocationBodySchema = {
  type: 'object',
  properties: {
    genre: { type: 'string', description: 'Genre of the world (ex. "fantasy" or "science fiction")' },
    worldFeeling: { type: 'string', description: 'The feeling of the world (ex. "humorous" or "apocalyptic")' },
    type: { type: 'string', description: 'The type of location (ex. "town" or "kingdom" or "swamp")' },
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

export const generateLocationResponseSchema = {
  type: 'object',
  properties: {
    name: { type: 'string', description: 'The generated locations\'s name' },
    description: { type: 'string', description: 'A detailed description or the location' }
  },
  required: ['name', 'description']
} as const;

export const generateLocationInputSchema = createInputSchema('Generate an location', ['location', 'gpt'], generateLocationBodySchema, generateLocationResponseSchema);

export type GenerateLocationRequest = FastifyRequest<{ Body: FromSchema<typeof generateLocationBodySchema> }>;
export type GenerateLocationOutput = FromSchema<typeof generateLocationResponseSchema> ;

