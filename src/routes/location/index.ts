import { getCompletion } from '@/services/llm';
import { FastifyInstance, FastifyReply, } from 'fastify';
import { 
  generateLocationInputSchema, 
  GenerateLocationOutput, 
  GenerateLocationRequest,
  generateLocationImageInputSchema,
  GenerateLocationImageOutput,
  GenerateLocationImageRequest
} from '@/schemas';
import { generateImage } from '@/services/images';
import { generateNameInstruction } from '@/utils/nameStyleSelector';
import { generateEntitySystemPrompt, generateDescriptionDefinition } from '@/utils/entityPromptHelpers';


// note: we don't clean briefDescription in these functions because there generally shouldn't be any HTML in it and if someone goes out of their way
//    to inject HTML, etc. it's unclear there's any risk

async function routes (fastify: FastifyInstance): Promise<void> {
  fastify.post('/generate', { schema: generateLocationInputSchema }, async (request: GenerateLocationRequest, reply: FastifyReply): Promise<GenerateLocationOutput> => {
    const { genre, settingFeeling, type, briefDescription, name, parentName, parentType, parentDescription, grandparentName, grandparentType, grandparentDescription, createLongDescription, longDescriptionParagraphs, nameStyles, textModel } = request.body;

    const system = generateEntitySystemPrompt('location', genre, settingFeeling);

    const descriptionDefinition = generateDescriptionDefinition(createLongDescription || false, `
        The description should be in the style of a concise, fast-to-use location description for a tabletop RPG. 
        Keep each section to a single short sentence or list.
        Avoid fictional comparisons.
        Keep it brief, vivid, and immediately usable at the table with original descriptions a game master can use at a glance.
        Follow this structure (SEPARATING SECTIONS AND ANY LISTS WITH \\n and MAKING SURE to include the field labels and asterisks):
        first line (don't include this header): a 1-sentence summary of what the location is and its main vibe.
        **Notable features:** list of 3 key physical or cultural details, separated by commas.
        **Sights, sounds, smells:** 3 quick sensory cues for immersion, separated by commas.
        **Role-play hooks:** 2 ideas for how characters might interact with or feel about the location
      `, longDescriptionParagraphs);

    const nameInstruction = generateNameInstruction(name, nameStyles);
    
    const prompt = `
      I need you to suggest one name and one description for a location. ${descriptionDefinition} 
      ${nameInstruction ? `${nameInstruction}` : ''}
      ${type ? `The type of location is a ${type}.` : ''}
      ${parentName ? `The location is in ${parentName + (parentName ? ' (which is a ' + parentType + ')' : '') + '. ' + (parentDescription ? 'Here is some information about ' + parentName + ': ' + parentDescription + '.' : '.')}` : ''}
      ${grandparentName ? `${parentName} is located in ${grandparentName + (grandparentType ? ' (which is a ' + grandparentType + ')' : '')}. ${(grandparentDescription ? 'Here is some information about ' + grandparentName + ': ' + grandparentDescription + '.' : '.')}` : ''}
      ${briefDescription ? `Here is a brief description of the location that you should use as a starting point.
        THIS IS THE MOST IMPORTANT THING! YOUR GENERATED DESCRIPTION MUST
        INCLUDE ALL OF THESE FACTS. REQUIRED FACTS: ${briefDescription}` : ''}
      You should only take the world feeling and species description into account in ways that do not contradict the other information.
    `;

    try {
      const result = (await getCompletion(system, prompt, 1, textModel)) as { name: string, description: string } || { name: '', description: ''};
      if (!result.name || !result.description) {
        return reply.status(500).send({ error: 'Failed to generate location due to an invalid response from the provider.' });
      }

      const location = {
        name: result.name,
        description: result.description,
        type: type || null,
      } as GenerateLocationOutput;

      return location;
    } catch (error) {
      console.error('Error generating location:', error);
      return reply.status(503).send({ error: (error as Error).message });
    }
  });

  fastify.post('/generate-image', { schema: generateLocationImageInputSchema }, async (request: GenerateLocationImageRequest, reply: FastifyReply): Promise<GenerateLocationImageOutput> => {
    const { genre, settingFeeling, name, type, parentName, parentType, parentDescription, grandparentName, grandparentType, grandparentDescription, briefDescription, textModel, imageModel } = request.body;

    // get a good prompt
    const system = `
      I am writing a ${genre} novel. ${settingFeeling ? 'The feeling of the world is: ' + settingFeeling + '.\n' : ''} You are my assistant.
      Your job is to write prompts for AI image generators like DALL-E or Stable Diffusion.  It should be very detailed - about a paragraph
      Each response must contain ONLY ONE PROMPT FOR AN IMAGE AND NOTHING ELSE.  THE IMAGE TYPE DESCRIPTION SHOULD BE:
      fantasy art, photorealistic, cinematic lighting, ultra detail, sharp focus 
      EACH RESPONSE SHOULD CONTAIN ONE FIELD:
      1. "prompt": THE PROMPT YOU WROTE
    `;

    const prompt = `
      I need you to suggest a prompt for creating an image of a location.  
      ${name ? `The location is named ${name}.` : ''}
      ${type ? `The type of location is a ${type}.` : ''}
      ${parentName ? `The location is in ${parentName + (parentName ? ' (which is a ' + parentType + ')' : '') + '. ' + (parentDescription ? 'Here is some information about ' + parentName + ': ' + parentDescription + '.' : '.')}` : ''}
      ${grandparentName ? `${parentName} is located in ${grandparentName + (grandparentType ? ' (which is a ' + grandparentType + ')' : '')}. ${(grandparentDescription ? 'Here is some information about ' + grandparentName + ': ' + grandparentDescription + '.' : '.')}` : ''}
      ${parentName || grandparentName ? 'ONLY USE INFORMATION ON THE BROADER PLACES IF IT DOESN\'T CONFLICT WITH THE LOCATION DESCRIPTION. IT IS ONLY SUPPLEMENTAL' : ''}
      ${briefDescription ? `Here is a brief description of the location that you should use as a starting point.
        THIS IS THE MOST IMPORTANT THING! DESCRIPTION: ${briefDescription}` : ''}
      You should only take the world feeling and species description into account in ways that DO NOT contradict the other information.
    `;

    try {
      const imagePrompt = await getCompletion(system, prompt, 1, textModel) as { prompt: string } | undefined;

      if (!imagePrompt?.prompt) {
        return reply.status(500).send({ error: 'Failed to generate location image prompt due to an invalid response from the provider.' });
      }

      // generate in landscape
      const imageUrl = await generateImage(imagePrompt.prompt, 'location-image', { aspect_ratio: '4:3' }, imageModel);

      return { filePath: imageUrl } as GenerateLocationImageOutput;
    } catch (error) {
      console.error('Error generating location image:', error);
      return reply.status(503).send({ error: `Failed to generate location image: ${(error as Error)?.message}` });
    }
  });
}

export default routes;

