import { FastifyInstance } from 'fastify';
import bearerAuthPlugin from '@fastify/bearer-auth';
import characterRoutes from './character';

/**
 * Encapsulates the routes
 * @param {FastifyInstance} fastify  Encapsulated Fastify Instance
 */
async function routes (fastify: FastifyInstance): Promise<void> {
	// authenticate all routes
	fastify.register(bearerAuthPlugin, { keys: [process.env.API_TOKEN as string] });

  fastify.register(characterRoutes, { prefix: '/character' });
}

export default routes;

