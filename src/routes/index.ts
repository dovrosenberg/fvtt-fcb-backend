import { version } from '../../package.json';
import { FastifyInstance, } from 'fastify';
import bearerAuthPlugin from '@fastify/bearer-auth';
import characterRoutes from './character';
import organizationRoutes from './organization';
import locationRoutes from './location';
import nameRoutes from './name';
import gmailRoutes from './gmail';
import { versionInputSchema, VersionOutput } from '@/schemas';

/**
 * Encapsulates the routes
 * @param {FastifyInstance} fastify  Encapsulated Fastify Instance
 */
async function routes (fastify: FastifyInstance): Promise<void> {
  // authenticate all routes
  fastify.register(bearerAuthPlugin, { keys: [process.env.API_TOKEN as string] });

  // provide the version
  fastify.get('/version', { schema: versionInputSchema }, async (): Promise<VersionOutput> => ({ 
    // for 1.0.1 just return 1.0.0
    // starting in 1.1.0 start to return just major.minor
    version: '1.0.0', // version 
  }));

  fastify.register(characterRoutes, { prefix: '/character' });
  fastify.register(organizationRoutes, { prefix: '/organization' });
  fastify.register(locationRoutes, { prefix: '/location' });
  fastify.register(nameRoutes, { prefix: '/name' });
  fastify.register(gmailRoutes, { prefix: '/pollEmail' });
}

export default routes;

