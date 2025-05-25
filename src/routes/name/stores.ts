import { FastifyInstance, FastifyReply, } from 'fastify';
import {
  generateStoreNamesInputSchema,
  GenerateStoreNamesOutput,
  GenerateStoreNamesRequest
} from '@/schemas';
import { generateRollTableCompletions } from '@/utils/rollTableGenerators';

async function routes (fastify: FastifyInstance): Promise<void> {
  fastify.post('/stores', { schema: generateStoreNamesInputSchema }, async (request: GenerateStoreNamesRequest, _reply: FastifyReply): Promise<GenerateStoreNamesOutput> => {
    const { count, genre, worldFeeling, storeType, nameStyles } = request.body;

    const result = await generateRollTableCompletions({
      entityType: 'store',
      entityDescription: 'stores and shops',
      specificInstructions: 'Names should be a mix of one to three words long, and not too similar to each other.',
      count,
      genre: genre || '',
      worldFeeling: worldFeeling || '',
      nameStyles,
      storeType: storeType || ''
    });
  
    if (!result) {
      throw new Error('Error in /names/stores');
    }
        
    return result as GenerateStoreNamesOutput;
  });
};

export default routes;