import { FastifyInstance, FastifyReply, } from 'fastify';
import {
  generateCharacterNamesInputSchema,
  GenerateCharacterNamesOutput,
  GenerateCharacterNamesRequest,
} from '@/schemas';
import { generateRollTableCompletions } from '@/utils/rollTableGenerators';

async function routes (fastify: FastifyInstance): Promise<void> {
  fastify.post('/characters', { schema: generateCharacterNamesInputSchema }, async (request: GenerateCharacterNamesRequest, reply: FastifyReply): Promise<GenerateCharacterNamesOutput> => {
    const { count, genre, settingFeeling, nameStyles, model } = request.body;

    try {
      const result = await generateRollTableCompletions({
        entityType: 'character',
        entityDescription: 'fictional characters',
        specificInstructions: 'You will generate unique and appropriate character names based on the provided parameters. Names must include first and last names.',
        count,
        genre: genre || '',
        settingFeeling: settingFeeling || '',
        nameStyles,
        model,
      });
      
      if (!result) {
        return reply.status(500).send({ error: 'Failed to generate character names due to an invalid response from the provider.' });
      }
          
      return result as GenerateCharacterNamesOutput;
    } catch (error) {
      console.error('Error generating character names:', error);
      return reply.status(503).send({ error: (error as Error).message });
    }
  });
}

export default routes;