import { getCompletion } from '@/services/openai';
import { FastifyInstance, FastifyReply, } from 'fastify';
import {
  generateCharacterNamesInputSchema,
  GenerateCharacterNamesOutput,
  GenerateCharacterNamesRequest,
} from '@/schemas';

async function routes (fastify: FastifyInstance): Promise<void> {
  fastify.post('/characters', { schema: generateCharacterNamesInputSchema }, async (request: GenerateCharacterNamesRequest, _reply: FastifyReply): Promise<GenerateCharacterNamesOutput> => {
    const { count, genre, worldFeeling } = request.body;

    const system = `
      You are a creative name generator for fictional characters.
      You will generate unique and appropriate character names (first and last) based on the provided parameters.
      EACH RESPONSE MUST BE A VALID JSON ARRAY OF STRINGS, CONTAINING EXACTLY ${count} CHARACTER NAMES. 
      EACH RESPONSE SHOULD CONTAIN ONE FIELD:
      1. "names": AN ARRAY OF STRINGS, CONTAINING EXACTLY ${count} CHARACTER NAMES.
    `;

    const prompt = `
      Generate ${count} unique character names.
      ${genre ? `The names MUST  be appropriate for a ${genre} setting.` : ''}
      ${worldFeeling ? `The world has a ${worldFeeling} feeling or atmosphere, so names could reflect this tone, but only about half of your responses should take this into account.` : ''}
      Return ONLY an array of strings with the names. No explanations or additional text.
    `;

    const result = await getCompletion(system, prompt, 0.9) as { names: string[] } || { names: []};
    
    if (!result.names) {
      throw new Error('Error in /names/characters');
    }
        
    const nameList = {
      names: result.names,
    } as GenerateCharacterNamesOutput;
      
    return nameList;
  });
}

export default routes;