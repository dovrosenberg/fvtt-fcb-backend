import { FastifyInstance, FastifyReply, } from 'fastify';
import {
  generateTavernNamesInputSchema,
  GenerateTavernNamesOutput,
  GenerateTavernNamesRequest
} from '@/schemas';
import { generateRollTableCompletions } from '@/utils/rollTableGenerators';

async function routes (fastify: FastifyInstance): Promise<void> {
  fastify.post('/taverns', { schema: generateTavernNamesInputSchema }, async (request: GenerateTavernNamesRequest, _reply: FastifyReply): Promise<GenerateTavernNamesOutput> => {
    const { count, genre, worldFeeling, nameStyles } = request.body;

    const result = await generateRollTableCompletions({
      entityType: 'tavern',
      entityDescription: 'fictional taverns, inns, hotels, bars, and pubs',
      specificInstructions: 'Names should be a mix of one to three words long, and not too similar to each other.',
      count,
      genre: genre || '',
      worldFeeling: worldFeeling || '',
      nameStyles
    });

    if (!result) {
      throw new Error('Error in /names/taverns');
    }

    return result as GenerateTavernNamesOutput;
  });
};

export default routes;