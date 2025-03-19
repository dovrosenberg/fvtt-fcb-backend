export * from './character';
export * from './organization';
export * from './location';

import { FromSchema } from 'json-schema-to-ts';

export const versionResponseSchema = {
  type: 'object',
  properties: {
    version: { type: 'string', description: 'The current version of the backend' },
  },
  required: ['version']
} as const;

export type VersionOutput = FromSchema<typeof versionResponseSchema>;

