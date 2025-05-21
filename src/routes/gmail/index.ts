import { FastifyInstance } from 'fastify';
import { getTodoItems } from '@/services/gmail';
import { todoItemsInputSchema, TodoItemsOutput } from '@/schemas/gmail';

async function routes(fastify: FastifyInstance): Promise<void> {
  fastify.get('/todo', { schema: todoItemsInputSchema }, async (): Promise<TodoItemsOutput> => {
    const inboxLabel = 'INBOX';
    const items = await getTodoItems(inboxLabel);
    
    return { items };
  });
}

export default routes; 