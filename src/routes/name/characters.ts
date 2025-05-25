import { FastifyInstance, FastifyReply, } from 'fastify';
import {
  generateCharacterNamesInputSchema,
  GenerateCharacterNamesOutput,
  GenerateCharacterNamesRequest,
} from '@/schemas';
import { generateRollTableCompletions } from '@/utils/rollTableGenerators';

async function routes (fastify: FastifyInstance): Promise<void> {
  fastify.post('/characters', { schema: generateCharacterNamesInputSchema }, async (request: GenerateCharacterNamesRequest, _reply: FastifyReply): Promise<GenerateCharacterNamesOutput> => {
    const { count, genre, worldFeeling, nameStyles } = request.body;

    const result = await generateRollTableCompletions({
      entityType: 'character',
      entityDescription: 'fictional characters',
      specificInstructions: 'You will generate unique and appropriate character names (first and last) based on the provided parameters.',
      count,
      genre: genre || '',
      worldFeeling: worldFeeling || '',
      nameStyles
    });
    
    if (!result) {
      throw new Error('Error in /names/characters');
    }
        

    return result as GenerateCharacterNamesOutput;
  });
}

export default routes;