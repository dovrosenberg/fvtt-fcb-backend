import { getCompletion } from '@/services/openai';
import { FastifyInstance, FastifyReply, } from 'fastify';
import {
  generateStoreNamesInputSchema,
  GenerateStoreNamesOutput,
  GenerateStoreNamesRequest
} from '@/schemas';

async function routes (fastify: FastifyInstance): Promise<void> {
  fastify.post('/stores', { schema: generateStoreNamesInputSchema }, async (request: GenerateStoreNamesRequest, _reply: FastifyReply): Promise<GenerateStoreNamesOutput> => {
    const { count, genre, worldFeeling, storeType } = request.body;

    const system = `
      You are a creative name generator for fictional stores and shops.
      You will generate unique and appropriate store names based on the provided parameters. Names should be 
      a mix of one to three words long, and not too similar to each other.
      EACH RESPONSE MUST BE A JSON ARRAY OF STRINGS, CONTAINING EXACTLY ${count} STORE NAMES.
    `;

    const prompt = `
      Generate ${count} unique store or shop names.
      ${genre ? `The names should be appropriate for a ${genre} setting.` : ''}
      ${worldFeeling ? `The world has a ${worldFeeling} feeling or atmosphere, so names could reflect this tone, but only about one-third of your responses should take this into account.` : ''}
      ${storeType ? `The stores are specifically ${storeType}s. Names MUST reflect this type of business.` : ''}
      Return ONLY an array of strings with the names. No explanations or additional text.
    `;

    const result = await getCompletion(system, prompt, 0.7) as string[];
    
    if (!Array.isArray(result) || result.length !== count) {
      // Fallback in case the result isn't properly formatted
      throw new Error('Error generating store names: Invalid response format');
    }

    return { names: result };
  });
};

export default routes;