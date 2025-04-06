import { FastifyInstance, } from 'fastify';
import registerCharacterRoutes from './characters';
import registerTownRoutes from './towns';

async function routes (fastify: FastifyInstance): Promise<void> {
  await registerCharacterRoutes(fastify);
  await registerTownRoutes(fastify);
}

export default routes;