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
import { generateEntitySystemPrompt, generateDescriptionHeader } from '@/utils/entityPromptHelpers';
import { cleanText } from '@/utils/fileNames';


// note: we don't clean briefDescription in these functions because there generally shouldn't be any HTML in it and if someone goes out of their way
//    to inject HTML, etc. it's unclear there's any risk

async function routes (fastify: FastifyInstance): Promise<void> {
  fastify.post('/generate', { schema: generateLocationInputSchema }, async (request: GenerateLocationRequest, reply: FastifyReply): Promise<GenerateLocationOutput> => {
    const { genre, settingFeeling, rpgStyle, type, briefDescription, name, parentName, parentType, parentDescription, grandparentName, grandparentType, grandparentDescription, longDescriptionParagraphs, nameStyles, textModel } = request.body;

    const system = generateEntitySystemPrompt('location', rpgStyle, genre, settingFeeling);

    const descriptionDefinition = generateDescriptionHeader('location', rpgStyle, 
      'Focus on sensory details (sight, sound, smell, mood) without explaining history, mechanics, or secrets. Avoid backstory, stats, secret motives, or mechanical detail — keep it to what the PCs see, hear, and sense right now.',
      'Hidden details, history, or lore. You do not need to include interactive elements like NPCs, traps, etc. unless provided in the brief description I give you.',
      `first line (don't include this header): a 1-sentence summary of what the location is and its main vibe.
        \\n**Notable features:** list of 3 key physical or cultural details, separated by commas.
        \\n**Sights, sounds, smells:** 3 quick sensory cues for immersion, separated by commas.
        \\n**Role-play hooks:** 2 ideas for how characters might interact with or feel about the location
      `, longDescriptionParagraphs);

    const nameInstruction = generateNameInstruction(name, nameStyles);
    
    const prompt = `
      I need you to suggest one name and two descriptions for a location. ${descriptionDefinition} 
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
      const result = (await getCompletion(system, prompt, 1, textModel)) as { name: string, roleplayNotes: string, longDescription: string } || { name: '', roleplayNotes: '', longDescription: ''};
      if (!result.name || !result.roleplayNotes || !result.longDescription) {
        return reply.status(500).send({ error: 'Failed to generate location due to an invalid response from the provider.' });
      }

      const location = {
        name: result.name,
        description: {
          roleplayNotes: result.roleplayNotes,
          long: result.longDescription,
        },
        type: type || null,
      } as GenerateLocationOutput;

      return location;
    } catch (error) {
      console.error('Error generating location:', error);
      return reply.status(503).send({ error: (error as Error).message });
    }
  });

  // fastify.post('/generate-image', { schema: generateLocationImageInputSchema }, async (request: GenerateLocationImageRequest, reply: FastifyReply): Promise<GenerateLocationImageOutput> => {
  //   const { genre, settingFeeling, name, type, parentName, parentType, parentDescription, grandparentName, grandparentType, grandparentDescription, briefDescription, textModel, imageModel } = request.body;

  //   // get a good prompt
  //   const system = `
  //     I am writing a ${genre} novel. ${settingFeeling ? 'The feeling of the world is: ' + settingFeeling + '.\n' : ''} You are my assistant.
  //     Your job is to write prompts for AI image generators like DALL-E or Stable Diffusion.  It should be very detailed - about a paragraph
  //     Each response must contain ONLY ONE PROMPT FOR AN IMAGE AND NOTHING ELSE.  THE IMAGE TYPE DESCRIPTION SHOULD BE:
  //     fantasy art, photorealistic, cinematic lighting, ultra detail, sharp focus 
  //     EACH RESPONSE SHOULD CONTAIN ONE FIELD:
  //     1. "prompt": THE PROMPT YOU WROTE
  //   `;

  //   const prompt = `
  //     I need you to suggest a prompt for creating an image of a location.  
  //     ${name ? `The location is named ${name}.` : ''}
  //     ${type ? `The type of location is a ${type}.` : ''}
  //     ${parentName ? `The location is in ${parentName + (parentName ? ' (which is a ' + parentType + ')' : '') + '. ' + (parentDescription ? 'Here is some information about ' + parentName + ': ' + parentDescription + '.' : '.')}` : ''}
  //     ${grandparentName ? `${parentName} is located in ${grandparentName + (grandparentType ? ' (which is a ' + grandparentType + ')' : '')}. ${(grandparentDescription ? 'Here is some information about ' + grandparentName + ': ' + grandparentDescription + '.' : '.')}` : ''}
  //     ${parentName || grandparentName ? 'ONLY USE INFORMATION ON THE BROADER PLACES IF IT DOESN\'T CONFLICT WITH THE LOCATION DESCRIPTION. IT IS ONLY SUPPLEMENTAL' : ''}
  //     ${briefDescription ? `Here is a brief description of the location that you should use as a starting point.
  //       THIS IS THE MOST IMPORTANT THING! DESCRIPTION: ${briefDescription}` : ''}
  //     You should only take the world feeling and species description into account in ways that DO NOT contradict the other information.
  //   `;

  //   try {
  //     const imagePrompt = await getCompletion(system, prompt, 1, textModel) as { prompt: string } | undefined;

  //     if (!imagePrompt?.prompt) {
  //       return reply.status(500).send({ error: 'Failed to generate location image prompt due to an invalid response from the provider.' });
  //     }

  //     // generate in landscape
  //     const prefix = name ? cleanText(name) : 'location'; 
  //     const imageUrl = await generateImage(imagePrompt.prompt, prefix, { aspect_ratio: '4:3' }, imageModel);

  //     return { filePath: imageUrl } as GenerateLocationImageOutput;
  //   } catch (error) {
  //     console.error('Error generating location image:', error);
  //     return reply.status(503).send({ error: `Failed to generate location image: ${(error as Error)?.message}` });
  //   }
  // });
}

export default routes;

