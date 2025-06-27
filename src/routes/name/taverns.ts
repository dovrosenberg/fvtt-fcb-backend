import { FastifyInstance, FastifyReply, } from 'fastify';
import {
  generateTavernNamesInputSchema,
  GenerateTavernNamesOutput,
  GenerateTavernNamesRequest
} from '@/schemas';
import { generateRollTableCompletions } from '@/utils/rollTableGenerators';

async function routes (fastify: FastifyInstance): Promise<void> {
  fastify.post('/taverns', { schema: generateTavernNamesInputSchema }, async (request: GenerateTavernNamesRequest, reply: FastifyReply): Promise<GenerateTavernNamesOutput> => {
    const { count, genre, settingFeeling, nameStyles, textModel } = request.body;

    try {
      const result = await generateRollTableCompletions({
        entityType: 'tavern',
        entityDescription: 'fictional taverns, inns, hotels, bars, and pubs',
        specificInstructions: 'Names should be a mix of one to three words long, and not too similar to each other.',
        count,
        genre: genre || '',
        settingFeeling: settingFeeling || '',
        nameStyles,
        textModel,
      });

      if (!result) {
        return reply.status(500).send({ error: 'Failed to generate tavern names due to an invalid response from the provider.' });
      }

      return result as GenerateTavernNamesOutput;
    } catch (error) {
      console.error('Error generating tavern names:', error);
      return reply.status(503).send({ error: (error as Error).message });
    }
  });
};

export default routes;