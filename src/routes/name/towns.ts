import { FastifyInstance, FastifyReply, } from 'fastify';
import {
  generateTownNamesInputSchema,
  GenerateTownNamesOutput,
  GenerateTownNamesRequest
} from '@/schemas';
import { generateRollTableCompletions } from '@/utils/rollTableGenerators';

async function routes (fastify: FastifyInstance): Promise<void> {
  fastify.post('/towns', { schema: generateTownNamesInputSchema }, async (request: GenerateTownNamesRequest, reply: FastifyReply): Promise<GenerateTownNamesOutput> => {
    const { count, genre, settingFeeling, nameStyles, model } = request.body;

    try {
      const result = await generateRollTableCompletions({
        entityType: 'town',
        entityDescription: 'towns and settlements',
        specificInstructions: 'Names should be a mix of one to three words long, and not too similar to each other.',
        count,
        genre: genre || '',
        settingFeeling: settingFeeling || '',
        nameStyles,
        model,
      });
      
      if (!result) {
        return reply.status(500).send({ error: 'Failed to generate town names due to an invalid response from the provider.' });
      }
          
      return result as GenerateTownNamesOutput;
    } catch (error) {
      console.error('Error generating town names:', error);
      return reply.status(503).send({ error: (error as Error).message });
    }
  });
};

export default routes;