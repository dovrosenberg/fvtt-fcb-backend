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
    `;

    const prompt = `
      Generate ${count} unique character names.
      ${genre ? `The names MUST  be appropriate for a ${genre} setting.` : ''}
      ${worldFeeling ? `The world has a ${worldFeeling} feeling or atmosphere, so names could reflect this tone, butonly  give this a light weight.` : ''}
      Return ONLY an array of strings with the names. No explanations or additional text.
    `;

    const result = await getCompletion(system, prompt, 0.9) as string[];
    
    if (!Array.isArray(result) || result.length !== count) {
      // Fallback in case the result isn't properly formatted
      throw new Error('Error generating character names: Invalid response format');
    }

    return { names: result };
  });
}

export default routes;