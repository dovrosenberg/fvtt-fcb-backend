import { FastifyInstance, } from 'fastify';
import registerCharacterRoutes from './characters';
import registerTownRoutes from './towns';
import registerStoreRoutes from './stores';
import registerTavernRoutes from './taverns';

async function routes (fastify: FastifyInstance): Promise<void> {
  await registerCharacterRoutes(fastify);
  await registerTownRoutes(fastify);
  await registerStoreRoutes(fastify);
  await registerTavernRoutes(fastify);
}

export default routes;