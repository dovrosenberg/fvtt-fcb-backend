import { getPreviewCompletion } from '@/services/llm';
import { FastifyInstance, FastifyReply, } from 'fastify';
import {
  generatePreviewNamesInputSchema,
  GeneratePreviewNamesOutput,
  GeneratePreviewNamesRequest,
} from '@/schemas';

async function routes (fastify: FastifyInstance): Promise<void> {
  fastify.post('/preview', { schema: generatePreviewNamesInputSchema }, async (request: GeneratePreviewNamesRequest, reply: FastifyReply): Promise<GeneratePreviewNamesOutput> => {
    const { genre, settingFeeling, nameStyles } = request.body;

    let prompt = `
      Generate two character names and two location names for each of the following naming styles:`;

    for (let i=0; i<nameStyles.length; i++) {
      prompt += `\n${i+1}. "${nameStyles[i]}"`;
    }

    prompt += `
      The genre is: ${genre}.
      The world has a tone or atmosphere of: ${settingFeeling}.

      Each name should reflect the given naming style and fit within the setting.
      Character names should include first and last names.
      Location names should represent places like taverns, shops, or landmarks.

      Return ONLY a JSON array of 5 objects, each with:
      - "people": [name1, name2]
      - "locations": [name1, name2]
      `;


    try {
      const result = await getPreviewCompletion(nameStyles, prompt, 0.9);
      
      if (result.length!==nameStyles.length) {
        return reply.status(500).send({ error: 'Failed to generate name previews due to an invalid response from the provider.' });
      }
          
      return {
        preview: result,
      };
    } catch (error) {
      console.error('Error generating name previews:', error);
      return reply.status(503).send({ error: (error as Error).message });
    }
  });
}

export default routes;