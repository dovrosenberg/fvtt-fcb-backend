import { getCompletion } from '@/services/llm';
import { FastifyInstance, FastifyReply, } from 'fastify';
import { 
  generateOrganizationInputSchema, 
  GenerateOrganizationOutput, 
  GenerateOrganizationRequest, 
  generateOrganizationImageInputSchema, 
  GenerateOrganizationImageRequest, 
  GenerateOrganizationImageOutput 
} from '@/schemas';
import { generateImage } from '@/services/images';
import { generateNameInstruction } from '@/utils/nameStyleSelector';
import { generateEntitySystemPrompt, generateDescriptionDefinition } from '@/utils/entityPromptHelpers';


// note: we don't clean briefDescription in these functions because there generally shouldn't be any HTML in it and if someone goes out of their way
//    to inject HTML, etc. it's unclear there's any risk

async function routes (fastify: FastifyInstance): Promise<void> {
  fastify.post('/generate', { schema: generateOrganizationInputSchema }, async (request: GenerateOrganizationRequest, reply: FastifyReply): Promise<GenerateOrganizationOutput> => {
    const { genre, settingFeeling, type, briefDescription, name, parentName, parentType, parentDescription, longDescriptionParagraphs, nameStyles, textModel } = request.body;
  
    const system = generateEntitySystemPrompt('organization',genre, settingFeeling);

    const descriptionDefinition = generateDescriptionDefinition(`
        The description should be in the style of a concise, fast-to-use organization description for a tabletop RPG. 
        Keep each section to a single short sentence or list.
        Avoid fictional comparisons.
        Keep it brief, vivid, and immediately usable at the table with original descriptions a game master can use at a glance.
        THIS FIELD SHOULD NOT BE A NESTED JSON STRUCTURE - IT SHOULD JUST BE A STRING!  Follow this structure (SEPARATING SECTIONS AND ANY LISTS WITH \\n and MAKING SURE to include the field labels and asterisks):
        first line (don't include this header): a 1-sentence summary of who they are and what they want
        **Symbols, colors, or style:** a quick description of their visual identity
        **Core beliefs or goals:** list of 3 things that motivate them
        **Methods and behavior:** 3 bullet points on how they operate
        **Role-play hooks:** 2 ideas for how characters might interact with or feel about the organization
      `, longDescriptionParagraphs);

    const nameInstruction = generateNameInstruction(name, nameStyles);
    
    const prompt = `
      I need you to suggest one name and two descriptions for an organization. ${descriptionDefinition}
      ${nameInstruction ? `${nameInstruction}` : ''}
      ${type ? `The type of organization is a ${type}.` : ''}
      ${parentName ? `The organization is a part of an organization called ${parentName + (parentName ? ' (which is a ' + parentType + ')' : '') + '. ' + (parentDescription ? 'Here is some information about ' + parentName + ': ' + parentDescription + '.' : '.')}` : ''}
      ${briefDescription ? `Here is a brief description of the organization that you should use as a starting point.
        THIS IS THE MOST IMPORTANT THING! YOUR GENERATED DESCRIPTION MUST
        INCLUDE ALL OF THESE FACTS. REQUIRED FACTS: ${briefDescription}` : ''}
      You should only take the world feeling and species description into account in ways that do not contradict the other information.
    `;
  
    try {
      const result = (await getCompletion(system, prompt, 1, textModel)) as { name: string, roleplayNotes: string, longDescription: string } || { name: '', roleplayNotes: '', longDescription: ''};
      if (!result.name || !result.roleplayNotes || !result.longDescription) {
        return reply.status(500).send({ error: 'Failed to generate organization due to an invalid response from the provider.' });
      }
      
      const organization = {
        name: result.name,
        description: {
          roleplayNotes: result.roleplayNotes,
          long: result.longDescription,
        },
      } as GenerateOrganizationOutput;
    
      return organization;
    } catch (error) {
      console.error('Error generating organization:', error);
      return reply.status(503).send({ error: (error as Error).message });
    }
  });

  fastify.post('/generate-image', { schema: generateOrganizationImageInputSchema }, async (request: GenerateOrganizationImageRequest, reply: FastifyReply): Promise<GenerateOrganizationImageOutput> => {
    const { genre, settingFeeling, type, briefDescription, name, parentName, parentType, parentDescription, grandparentName, grandparentType, grandparentDescription, textModel, imageModel } = request.body;

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
      I need you to suggest a prompt creating an image of an organization or perhaps an insignia.  
      ${name ? `The name of organization is ${name}` : ''}.
      ${type ? `The type of organization is a ${type}` : ''}.
      ${parentName ? `The organization is a part of an organization called ${parentName + (parentName ? '(which is a ' + parentType + ')' : '') + '.  ' + (parentDescription ? 'Here is some information about ' + parentName + ': ' + parentDescription + '.' : '.')}` : ''}
      ${grandparentName ? `${parentName} is part of a bigger organization called in ${grandparentName + (grandparentType ? '(which is a ' + grandparentType + ')' : '')}. ${(grandparentDescription ? 'Here is some information about ' + grandparentName + ': ' + grandparentDescription + '.' : '.')}` : ''}
      ${parentName || grandparentName ? 'ONLY USE INFORMATION ON THE BROADER ORGANIZATIONS IF IT DOESN\'T CONFLICT WITH THE ORGANIZATION DESCRIPTION. IT IS ONLY SUPPLEMENTAL' : ''}
      ${briefDescription ? `Here is a brief description of the organization that you should use as a starting point.
        THIS IS THE MOST IMPORTANT THING!  DESCRIPTION: ${briefDescription}` : ''}
      You should only take the world feeling and species description into account in ways that DO NOT contradict the other information.
    `;

    try {
      const imagePrompt = await getCompletion(system, prompt, 1, textModel) as { prompt: string } | undefined;

      if (!imagePrompt?.prompt) {
        return reply.status(500).send({ error: 'Failed to generate organization image prompt due to an invalid response from the provider.' });
      }

      const imageUrl = await generateImage(imagePrompt.prompt, 'organization-image', {}, imageModel);

      return { filePath: imageUrl } as GenerateOrganizationImageOutput;
    } catch (error) {
      console.error('Error generating organization image:', error);
      return reply.status(503).send({ error: `Failed to generate organization image: ${(error as Error)?.message}` });
    }
  });
}


export default routes;

