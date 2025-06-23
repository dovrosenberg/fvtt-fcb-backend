import { FromSchema } from 'json-schema-to-ts';
import { createGetInputSchema } from '@/schemas/utils';

export const todoItemsResponseSchema = {
  type: 'object',
  properties: {
    items: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          timestamp: { type: 'string', description: 'ISO timestamp of when the email was received' },
          text: { type: 'string', description: 'The content of the email' }
        },
        required: ['timestamp', 'text']
      }
    }
  },
  required: ['items']
} as const;

export type TodoItemsOutput = FromSchema<typeof todoItemsResponseSchema>;

export const todoItemsInputSchema = createGetInputSchema(
  'Get todo items from Gmail inbox',
  todoItemsResponseSchema
); 