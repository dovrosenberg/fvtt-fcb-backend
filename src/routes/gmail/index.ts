import { FastifyInstance, FastifyReply } from 'fastify';
import { getTodoItems } from '@/services/gmail';

interface GetTodoItemsResponse {
  items: Array<{
    timestamp: string;
    text: string;
  }>;
}

async function routes(fastify: FastifyInstance): Promise<void> {
  fastify.get('/todo', async (_request, _reply: FastifyReply): Promise<GetTodoItemsResponse> => {
    const inboxLabel = 'INBOX';
    const items = await getTodoItems(inboxLabel);
    
    return { items };
  });
}

export default routes; 