import { FromSchema } from 'json-schema-to-ts';

export * from './character';
export * from './organization';
export * from './location';
export * from './name';
export * from './custom';
export * from './gmail';

import { createGetInputSchema } from '@/schemas/utils';

export const versionResponseSchema = {
  type: 'object',
  properties: {
    version: { type: 'string', description: 'The current version of the backend' },
  },
  required: ['version']
} as const;

export type VersionOutput = FromSchema<typeof versionResponseSchema>;

export const versionInputSchema = createGetInputSchema('Get current backend version', versionResponseSchema);
