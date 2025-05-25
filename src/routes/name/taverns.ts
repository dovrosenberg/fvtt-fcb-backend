import { getCompletion } from '@/services/openai';
import { FastifyInstance, FastifyReply, } from 'fastify';
import {
  generateTavernNamesInputSchema,
  GenerateTavernNamesOutput,
  GenerateTavernNamesRequest
} from '@/schemas';

async function routes (fastify: FastifyInstance): Promise<void> {
  fastify.post('/taverns', { schema: generateTavernNamesInputSchema }, async (request: GenerateTavernNamesRequest, _reply: FastifyReply): Promise<GenerateTavernNamesOutput> => {
    const { count, genre, worldFeeling, nameStyles } = request.body;

    const system = `
      You are a creative name generator for fictional taverns, inns, hotels, bars, and pubs.
      You will generate unique and appropriate tavern names based on the provided parameters. Names should be 
      a mix of one to three words long, and not too similar to each other.
      EACH RESPONSE SHOULD CONTAIN ONE FIELD:
      1. "names": AN ARRAY OF STRINGS, CONTAINING EXACTLY ${count} TAVERN NAMES.
    `;

    const prompt = `
      Generate ${count} unique tavern, hotel, inn, pub, or bar names.      
      ${genre ? `The names should be appropriate for a ${genre} setting.` : ''}
      ${worldFeeling ? `The world has a ${worldFeeling} feeling or atmosphere. Let about one-third of your names reflect this tone.` : ''}
      ${nameStyles && nameStyles.length > 0 ? `90% of names should use the following naming styles, with roughly even portions coming from each: ${nameStyles.join(', ')}.` : ''}
      Ensure each name clearly fits one of the provided styles, and do not cluster all names of a single style together.
      Return ONLY a valid JSON array of strings. No explanations or extra text.
  `;

    const result = await getCompletion(system, prompt, 0.9) as { names: string[] } || { names: []};
    
    if (!result.names) {
      throw new Error('Error in /names/taversn');
    }
        
    const nameList = {
      names: result.names,
    } as GenerateTavernNamesOutput;
      
    return nameList;
  });
};

export default routes;