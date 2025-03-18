import { FastifyInstance } from 'fastify';
import { generateCharacter } from '@/controllers';

const opts = {
  schema: {
    body: {
      type: 'object',
      properties: {
        genre: { type: 'string' },
        namee: { type: 'string' }
      },
      required: ['namee']    
    }
  }
}


/**
 * Encapsulates the routes
 * @param {FastifyInstance} fastify  Encapsulated Fastify Instance
 */
async function routes (fastify: FastifyInstance): Promise<void> {
  fastify.post('/generate', opts, generateCharacter);
}

export default routes;

