import { FastifyInstance } from 'fastify';
import { getTextModels, getImageModels } from '@/services/models';

async function modelRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.get('/text', async () => {
    return getTextModels();
  });

  fastify.get('/image', async () => {
    return getImageModels();
  });
}

export default modelRoutes;
