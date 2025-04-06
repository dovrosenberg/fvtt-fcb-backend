import { getCompletion } from '@/services/openai';
import { FastifyInstance, FastifyReply, } from 'fastify';
import {
  generateTavernNamesInputSchema,
  GenerateTavernNamesOutput,
  GenerateTavernNamesRequest
} from '@/schemas';

async function routes (fastify: FastifyInstance): Promise<void> {
  fastify.post('/taverns', { schema: generateTavernNamesInputSchema }, async (request: GenerateTavernNamesRequest, _reply: FastifyReply): Promise<GenerateTavernNamesOutput> => {
    const { count, genre, worldFeeling, } = request.body;

    const system = `
      You are a creative name generator for fictional taverns, inns, and pubs.
      You will generate unique and appropriate tavern names based on the provided parameters. Names should be 
      a mix of one to three words long, and not too similar to each other.
      EACH RESPONSE MUST BE A JSON ARRAY OF STRINGS, CONTAINING EXACTLY ${count} TAVERN NAMES.
    `;

    const prompt = `
      Generate ${count} unique tavern, inn, or pub names.
      ${genre ? `The names should be appropriate for a ${genre} setting.` : ''}
      ${worldFeeling ? `The world has a ${worldFeeling} feeling or atmosphere, so names could reflect this tone, but only about one-third of your responses should take this into account.` : ''}
      Return ONLY an array of strings with the names. No explanations or additional text.
    `;

    const result = await getCompletion(system, prompt, 0.7) as string[];
    
    if (!Array.isArray(result) || result.length !== count) {
      // Fallback in case the result isn't properly formatted
      throw new Error('Error generating tavern names: Invalid response format');
    }

    return { names: result };
  });
};

export default routes;