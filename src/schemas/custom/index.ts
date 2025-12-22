import { FastifyRequest, } from 'fastify';
import { FromSchema } from 'json-schema-to-ts';
import { createPostInputSchema } from '@/schemas/utils';
import { TextModels } from '@/services/models';

export enum ContentTypes {
  Setting = 'Setting',
  Character = 'Character',
  Location = 'Location',
  Organization = 'Organization',
  Campaign = 'Campaign',
  Arc = 'Arc',
  Session = 'Session',
  Front = 'Front',
}

export const ContentTypeDescriptions = {
  [ContentTypes.Setting]: 'A detailed setting description for a TTRPG world',
  [ContentTypes.Character]: 'A character',
  [ContentTypes.Location]: 'A location (anything from a continent to a kingdom to a specific room',
  [ContentTypes.Organization]: 'An organization',
  [ContentTypes.Campaign]: 'A group of sessions played by a group of players in a particular TTPG world setting',
  [ContentTypes.Arc]: 'A story arc',
  [ContentTypes.Session]: 'A single TTRPG sesion',
  [ContentTypes.Front]: 'A front or conflict description with stakes and players'
};

const generateCustomRequestSchema = {
  type: 'object',
  properties: {
    contentType: { type: 'string', enum: Object.values(ContentTypes), description: 'The type of content that we are generating text for (location, setting, etc.)' },
    name: { type: 'string', description: 'The entity\'s name.' },
    fieldLabel: { type: 'string', description: 'The label of the field being populated' },
    prompt: { type: 'string', description: 'The user\'s custom prompt to use for generation' },
    genre: { type: 'string', description: 'Genre of the world (ex. "fantasy" or "science fiction")' },
    settingFeeling: { type: 'string', description: 'The feeling of the setting (ex. "humorous" or "apocalyptic")' },
    type: { type: 'string', description: 'The type of the entity' },
    species: { type: 'string', description: 'The species of the entity' },
    speciesDescription: { type: 'string', description: 'A brief description of the species' },
    parentName: { type: 'string', description: 'The name of the parent entity' },
    parentType: { type: 'string', description: 'The type of parent entity' },
    parentDescription: { type: 'string', description: 'The current description of the entity\'s parent' },
    grandparentName: { type: 'string', description: 'The name of the grandparent entity' },
    grandparentType: { type: 'string', description: 'The type of grandparent entity' },
    grandparentDescription: { type: 'string', description: 'The current description of the entity\'s grandparent' },
    description: { type: 'string', description: 'A brief description of the entity to factor into the produced text' },
    nameStyles: { type: 'array', description: 'The styles of names to use', items: { type: 'string' }},
    textModel: { type: 'string', enum: Object.values(TextModels), description: 'The text generation model to use' },
  },
  required: ['genre', 'contentType', 'name', 'fieldLabel', 'prompt'],
} as const;


export const generateCustomResponseSchema = {
  type: 'object',
  properties: {
    response: { type: 'string', description: 'The generated response' },
  },
  required: ['response']
} as const;

export const generateCustomInputSchema = createPostInputSchema(
  'Generate custom text', 
  generateCustomRequestSchema, 
  generateCustomResponseSchema
);

export type GenerateCustomRequest = FastifyRequest<{ Body: FromSchema<typeof generateCustomRequestSchema> }>;

export type GenerateCustomOutput = FromSchema<typeof generateCustomResponseSchema>;
