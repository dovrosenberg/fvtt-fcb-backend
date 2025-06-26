import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { getTodoItems } from '@/services/gmail';
import { todoItemsInputSchema, TodoItemsOutput } from '@/schemas/gmail';

async function routes(fastify: FastifyInstance): Promise<void> {
  fastify.get('/todo', { schema: todoItemsInputSchema }, async (_request: FastifyRequest, reply: FastifyReply): Promise<TodoItemsOutput> => {
    try {
      const items = await getTodoItems();
      
      return { items };
    } catch (error) {
      console.error('Error getting todo items:', error);
      return reply.status(503).send({ error: (error as Error).message });
    }
  });
}

export default routes; 