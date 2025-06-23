import { FastifyInstance, FastifyReply, } from 'fastify';
import {
  generateCharacterNamesInputSchema,
  GenerateCharacterNamesOutput,
  GenerateCharacterNamesRequest,
} from '@/schemas';
import { generateRollTableCompletions } from '@/utils/rollTableGenerators';

async function routes (fastify: FastifyInstance): Promise<void> {
  fastify.post('/characters', { schema: generateCharacterNamesInputSchema }, async (request: GenerateCharacterNamesRequest, _reply: FastifyReply): Promise<GenerateCharacterNamesOutput> => {
    const { count, genre, settingFeeling, nameStyles } = request.body;

    const result = await generateRollTableCompletions({
      entityType: 'character',
      entityDescription: 'fictional characters',
      specificInstructions: 'You will generate unique and appropriate character names based on the provided parameters. Names must include first and last names.',
      count,
      genre: genre || '',
      settingFeeling: settingFeeling || '',
      nameStyles
    });
    
    if (!result) {
      throw new Error('Error in /names/characters');
    }
        

    return result as GenerateCharacterNamesOutput;
  });
}

export default routes;