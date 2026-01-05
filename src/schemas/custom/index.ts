import { FastifyRequest, } from 'fastify';
import { FromSchema } from 'json-schema-to-ts';
import { createPostInputSchema } from '@/schemas/utils';
import { TextModels, ImageModels } from '@/services/models';

export enum ContentTypes {
  Setting = 'Setting',
  Character = 'Character',
  Location = 'Location',
  PC = 'PC',
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
  [ContentTypes.PC]: 'A player character',
  [ContentTypes.Campaign]: 'A group of sessions played by a group of players in a particular TTPG world setting',
  [ContentTypes.Arc]: 'A story arc',
  [ContentTypes.Session]: 'A single TTRPG sesion',
  [ContentTypes.Front]: 'A front or conflict description with stakes and players'
};

const configurationSchema = {
  type: 'object',
  properties: {
    minWords: { type: 'number', description: 'Minimum words', default: 120 },
    maxWords: { type: 'number', description: 'Maximum words', default: 250 },
    tone: { type: 'string', description: 'Short description of the type of tone to use in the responses', default: "evocative, practical, table-ready" },
    tense: { type: 'string', description: 'The grammatical tense to use', default: "present" },
    pov: { type: 'string', description: 'The point of view to use', default: "third person" },
    contentRating: { type: 'string', description: 'Content rating', default: "PG-13" },
    includeHeadings: { type: 'boolean', description: 'Whether to include headings. Won\'t force headings, but will allow them.', default: false },
    includeBullets: { type: 'boolean', description: 'Whether to include bullets. Won\'t force bullets, but will allow them.', default: true },
    avoidListsLongerThan: { type: 'number', description: 'Maximum items in a list', default: 5 }
  }
} as const;

 const imageConfigurationSchema = {
  type: 'object',
  properties: {
    artStyle: { type: 'string', description: 'High-level art style / aesthetic (ex. "watercolor", "hand-drawn", "oil painting", "pixel art"). Default: "" (no preference)', default: '' },
    medium: { type: 'string', description: 'Medium / technique (ex. "ink", "gouache", "pencil sketch", "3D render"). Default: "" (no preference)', default: '' },
    modelStyle: { type: 'string', description: 'Model-specific style hint (ex. "cinematic", "anime", "comic"). Default: "" (no preference)', default: '' },
    contentRating: { type: 'string', description: 'Content rating / safety level (ex. "G", "PG", "PG-13", "R"). Default: "PG-13"', default: 'PG-13' },
 //  aspectRatio: { type: 'string', description: 'Aspect ratio hint (ex. "1:1", "16:9", "2:3")' },
    composition: { type: 'string', description: 'Composition direction (ex. "close-up portrait", "wide establishing shot", "rule of thirds"). Default: "" (no preference)', default: '' },
    lighting: { type: 'string', description: 'Lighting direction (ex. "golden hour", "moody rim light", "soft studio lighting"). Default: "" (no preference)', default: '' },
    colorPalette: { type: 'string', description: 'Color palette direction (ex. "muted earth tones", "vibrant neon"). Default: "" (no preference)', default: '' },
    camera: { type: 'string', description: 'Camera framing / lens hints (ex. "35mm", "telephoto", "shallow depth of field"). Default: "" (no preference)', default: '' },
    mood: { type: 'string', description: 'Mood / emotion (ex. "ominous", "whimsical", "serene"). Default: "" (no preference)', default: '' },
    negativePrompt: { type: 'string', description: 'Things to explicitly avoid in the image (ex. "text, watermark, extra limbs"). Default: "" (no negative prompt)', default: '' },
 //  styleTags: { type: 'array', description: 'Extra comma-separated style tags to include. Default: []', items: { type: 'string' }, default: [] },
    providerOptions: { type: 'object', description: 'Advanced provider/model options passed through to the image generator (model-specific). Default: {}', additionalProperties: true, default: {} },
  },
} as const;

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
    configuration: configurationSchema,
  },
  required: ['genre', 'contentType', 'name', 'prompt', 'fieldLabel' ],
} as const;

// Remove text-only configuration for image generation
const { configuration: _configuration, nameStyles: _nameStyles, fieldLabel: _fieldLabel, ...generateCustomImageProperties } = generateCustomRequestSchema.properties;
const required = generateCustomRequestSchema.required.filter((x) => x !== 'fieldLabel');

const generateCustomImageRequestSchema = {
  type: 'object',
  properties: {
    ...generateCustomImageProperties,
    imageModel: { type: 'string', enum: Object.values(ImageModels), description: 'The image generation model to use' },
    imageConfiguration: imageConfigurationSchema,
  },
  required: required,
} as const;

export const generateCustomResponseSchema = {
  type: 'object',
  properties: {
    response: { type: 'string', description: 'The generated response' },
  },
  required: ['response']
} as const;

export const generateCustomImageResponseSchema = {
  type: 'object',
  properties: {
    filePath: { type: 'string', description: 'The path of the new image' },
  },
  required: ['filePath']
} as const;

export const generateCustomInputSchema = createPostInputSchema(
  'Generate custom text', 
  generateCustomRequestSchema, 
  generateCustomResponseSchema
);

export const generateCustomImageInputSchema = createPostInputSchema(
  'Generate custom image',
  generateCustomImageRequestSchema,
  generateCustomImageResponseSchema
);

export type GenerateCustomRequest = FastifyRequest<{ Body: FromSchema<typeof generateCustomRequestSchema> }>;
export type GenerateCustomImageRequest = FastifyRequest<{ Body: FromSchema<typeof generateCustomImageRequestSchema> }>;

export type GenerateCustomOutput = FromSchema<typeof generateCustomResponseSchema>;
export type GenerateCustomImageOutput = FromSchema<typeof generateCustomImageResponseSchema>;
