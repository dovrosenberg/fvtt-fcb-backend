import { FastifyInstance, FastifyReply, } from 'fastify';
import {
  generateTownNamesInputSchema,
  GenerateTownNamesOutput,
  GenerateTownNamesRequest
} from '@/schemas';
import { generateRollTableCompletions } from '@/utils/rollTableGenerators';

async function routes (fastify: FastifyInstance): Promise<void> {
  fastify.post('/towns', { schema: generateTownNamesInputSchema }, async (request: GenerateTownNamesRequest, _reply: FastifyReply): Promise<GenerateTownNamesOutput> => {
    const { count, genre, settingFeeling, nameStyles } = request.body;

    const result = await generateRollTableCompletions({
      entityType: 'town',
      entityDescription: 'towns and settlements',
      specificInstructions: 'Names should be a mix of one to three words long, and not too similar to each other.',
      count,
      genre: genre || '',
      settingFeeling: settingFeeling || '',
      nameStyles
    });
    
    if (!result) {
      throw new Error('Error in /names/towns');
    }
        
    return result as GenerateTownNamesOutput;
  });
};

export default routes;