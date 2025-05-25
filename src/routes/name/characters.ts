import { getCompletion } from '@/services/openai';
import { FastifyInstance, FastifyReply, } from 'fastify';
import {
  generateCharacterNamesInputSchema,
  GenerateCharacterNamesOutput,
  GenerateCharacterNamesRequest,
} from '@/schemas';

async function routes (fastify: FastifyInstance): Promise<void> {
  fastify.post('/characters', { schema: generateCharacterNamesInputSchema }, async (request: GenerateCharacterNamesRequest, _reply: FastifyReply): Promise<GenerateCharacterNamesOutput> => {
    const { count, genre, worldFeeling, nameStyles } = request.body;

    // generate 30% extra because LLM won't get the count right
    const system = `
      You are a creative name generator for fictional characters.
      You will generate unique and appropriate character names (first and last) based on the provided parameters.
      EACH RESPONSE MUST BE A VALID JSON ARRAY OF STRINGS, CONTAINING EXACTLY ${count*1.3} CHARACTER NAMES. 
      EACH RESPONSE SHOULD CONTAIN ONE FIELD:
      1. "names": AN ARRAY OF STRINGS, CONTAINING EXACTLY ${count*1.3} CHARACTER NAMES.
    `;

    const prompt = `
      Generate ${count*1.3} unique character names.      
      ${genre ? `The names should be appropriate for a ${genre} setting.` : ''}
      ${worldFeeling ? `The world has a ${worldFeeling} feeling or atmosphere. Let about one-third of your names reflect this tone.` : ''}
      ${nameStyles && nameStyles.length > 0 ? `90% of names should use the following naming styles, with roughly even portions coming from each: ${nameStyles.join(', ')}.` : ''}
      Ensure each name clearly fits one of the provided styles, and do not cluster all names of a single style together.
      Return ONLY a valid JSON array of strings. No explanations or extra text.
    `;

    const result = await getCompletion(system, prompt, 0.9) as { names: string[] } || { names: []};
    
    if (!result.names) {
      throw new Error('Error in /names/characters');
    }
        
    const nameList = {
      names: result.names.slice(0, count), // Final safety check to ensure exact count
    } as GenerateCharacterNamesOutput;
      
    return nameList;
  });
}

export default routes;