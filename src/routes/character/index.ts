import { FastifyInstance } from 'fastify';
import { generateCharacter } from '@/controllers';

/**
 * Encapsulates the routes
 * @param {FastifyInstance} fastify  Encapsulated Fastify Instance
 */
async function routes (fastify: FastifyInstance): Promise<void> {
  fastify.post('/generate', generateCharacter);
}

export default routes;

