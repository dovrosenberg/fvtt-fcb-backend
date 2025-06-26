import { FastifyInstance, FastifyReply, } from 'fastify';
import {
  generateStoreNamesInputSchema,
  GenerateStoreNamesOutput,
  GenerateStoreNamesRequest
} from '@/schemas';
import { generateRollTableCompletions } from '@/utils/rollTableGenerators';

async function routes (fastify: FastifyInstance): Promise<void> {
  fastify.post('/stores', { schema: generateStoreNamesInputSchema }, async (request: GenerateStoreNamesRequest, reply: FastifyReply): Promise<GenerateStoreNamesOutput> => {
    const { count, genre, settingFeeling, storeType, nameStyles, model } = request.body;

    try {
      const result = await generateRollTableCompletions({
        entityType: 'store',
        entityDescription: 'stores and shops',
        specificInstructions: 'Names should be a mix of one to three words long, and not too similar to each other.',
        count,
        genre: genre || '',
        settingFeeling: settingFeeling || '',
        nameStyles,
        storeType: storeType || '',
        model,
      });
    
      if (!result) {
        return reply.status(500).send({ error: 'Failed to generate store names due to an invalid response from the provider.' });
      }
          
      return result as GenerateStoreNamesOutput;
    } catch (error) {
      console.error('Error generating store names:', error);
      return reply.status(503).send({ error: (error as Error).message });
    }
  });
};

export default routes;