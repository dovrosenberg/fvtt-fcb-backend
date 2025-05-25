import { getPreviewCompletion } from '@/services/openai';
import { FastifyInstance, FastifyReply, } from 'fastify';
import {
  generatePreviewNamesInputSchema,
  GeneratePreviewNamesOutput,
  GeneratePreviewNamesRequest,
} from '@/schemas';

async function routes (fastify: FastifyInstance): Promise<void> {
  fastify.post('/preview', { schema: generatePreviewNamesInputSchema }, async (request: GeneratePreviewNamesRequest, _reply: FastifyReply): Promise<GeneratePreviewNamesOutput> => {
    const { genre, worldFeeling, nameStyles } = request.body;

    let prompt = `
      Generate two character names and two location names for each of the following naming styles:`;

    for (let i=0; i<nameStyles.length; i++) {
      prompt += `\n${i+1}. "${nameStyles[i]}"`;
    }

    prompt += `
      The genre is: ${genre}.
      The world has a tone or atmosphere of: ${worldFeeling}.

      Each name should reflect the given naming style and fit within the setting.
      Character names may include first and last names or mononyms.
      Location names should represent places like taverns, shops, or landmarks.

      Return ONLY a JSON array of 5 objects, each with:
      - "people": [name1, name2]
      - "locations": [name1, name2]
      `;


    const result = await getPreviewCompletion(nameStyles, prompt, 0.9);
    
    if (result.length!==nameStyles.length) {
      throw new Error('Error in /names/preview');
    }
        
    return {
      preview: result,
    };
  });
}

export default routes;