import { FastifyInstance, } from 'fastify';
import { generateCharacter } from '@/controllers';
import { generateCharacterInputSchema } from '@/schemas';


/**
 * Encapsulates the routes
 * @param {FastifyInstance} fastify  Encapsulated Fastify Instance
 */
async function routes (fastify: FastifyInstance): Promise<void> {
  fastify.post('/generate', { schema: generateCharacterInputSchema }, generateCharacter);
}

export default routes;

