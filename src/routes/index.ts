import { FastifyInstance } from 'fastify';
import characterRoutes from './character';

/**
 * Encapsulates the routes
 * @param {FastifyInstance} fastify  Encapsulated Fastify Instance
 */
async function routes (fastify: FastifyInstance): Promise<void> {
  fastify.register(characterRoutes, { prefix: '/character' });
}

export default routes;

