import { getCompletion } from '@/services/llm';
import { generateImage } from '@/services/images';
import { FastifyInstance, FastifyReply, } from 'fastify';
import {
  generateCharacterInputSchema,
  GenerateCharacterOutput,
  GenerateCharacterRequest,
  generateCharacterImageInputSchema,
  GenerateCharacterImageOutput,
  GenerateCharacterImageRequest
} from '@/schemas';
import { generateNameInstruction } from '@/utils/nameStyleSelector';
import { generateEntitySystemPrompt, generateDescriptionDefinition } from '@/utils/entityPromptHelpers';


// note: we don't clean briefDescription in these functions because there generally shouldn't be any HTML in it and if someone goes out of their way
//    to inject HTML, etc. it's unclear there's any risk

async function routes (fastify: FastifyInstance): Promise<void> {
  fastify.post('/generate', { schema: generateCharacterInputSchema }, async (request: GenerateCharacterRequest, reply: FastifyReply): Promise<GenerateCharacterOutput> => {
    const { name, genre, settingFeeling, type, species, speciesDescription, briefDescription, createLongDescription, longDescriptionParagraphs, nameStyles, textModel } = request.body;

    const system = generateEntitySystemPrompt('character', genre, settingFeeling);

    const descriptionDefinition = generateDescriptionDefinition(createLongDescription || false, `
            The description should be in the style of a brief NPC description for a tabletop RPG.
            Keep each section to a single short sentence or list.
            Avoid fictional character references or long explanations.
            Write clearly, vividly, and efficiently.
            Follow this structure (SEPARATING SECTIONS AND ANY LISTS WITH \\n and MAKING SURE to include the field labels and asterisks):
            first line (don't include this header): a 1-sentence summary of who the NPC is and their general vibe.
            **Personality snapshot:** list of 3 key traits separated by commas.
            **Role-play hooks:** 2 tips on how to role-play them.
            **Appearance:** a quick description of their look.
          `, longDescriptionParagraphs);

    const nameInstruction = generateNameInstruction(name, nameStyles);
    
    const prompt = `
      I need you to suggest one name and one description for a character. ${descriptionDefinition} 
      ${nameInstruction ? `${nameInstruction}` : ''}
      ${type ? `The type of character is a ${type}. Give this moderate weight.` : ''}
          ${species ? `It should be a description of a ${species}.` : ''}
          ${species && speciesDescription ? `Here is a description of what a ${species} is. Give it light weight: ${speciesDescription}` : ''}
          ${briefDescription ? `Here is a brief description of the character that you should use as a starting point.
            THIS IS THE MOST IMPORTANT THING! EVEN MORE IMPORTANT THAN SPECIES DESCRIPTION/STEREOTYPES. YOUR GENERATED DESCRIPTION MUST
            INCLUDE ALL OF THESE FACTS. REQUIRED FACTS: ${briefDescription}` : ''}
          You should only take the world feeling and species description into account in ways that do not contradict the other information.
        `;

    try {
      const result = (await getCompletion(system, prompt, 1, textModel)) as { name: string, description: string } || { name: '', description: ''};
      if (!result.name || !result.description) {
        return reply.status(500).send({ error: 'Failed to generate character due to an invalid response from the provider.' });
      }

      const character = {
        name: result.name,
        description: result.description
      } as GenerateCharacterOutput;

      return character;
    } catch (error) {
      console.error('Error generating character:', error);
      return reply.status(503).send({ error: (error as Error).message });
    }
  });

  // Add the new endpoint for generating character images
  fastify.post('/generate-image', { schema: generateCharacterImageInputSchema }, async (request: GenerateCharacterImageRequest, reply: FastifyReply): Promise<GenerateCharacterImageOutput> => {
    const { genre, settingFeeling, name, type, species, speciesDescription, briefDescription, textModel, imageModel } = request.body;

    // get a good prompt
    const system = `
          I am writing a ${genre} novel. ${settingFeeling ? 'The feeling of the world is: ' + settingFeeling + '.\n' : ''} You are my assistant.
          Your job is to write prompts for AI image generators like DALL-E or Stable Diffusion.  It should be very detailed - about a paragraph
          Each response must contain ONLY ONE PROMPT FOR AN IMAGE AND NOTHING ELSE.  THE IMAGE TYPE DESCRIPTION SHOULD BE:
          fantasy art, photorealistic, cinematic lighting, ultra detail, sharp focus 
          EACH RESPONSE SHOULD CONTAIN ONE FIELDS:
          1. "prompt": THE PROMPT YOU WROTE
        `;

    // Construct a detailed prompt 
    const prompt = `
      I need you to suggest a prompt for creating an image of a character.
      ${name ? `The character is named ${name}` : ''}.
      ${type ? `The type of character is a ${type}.` : ''}.
      ${species ? `It should be a description of a ${species}.` : ''}
          ${species && speciesDescription ? `Here is a description of what a ${species} is. Give it light weight: ${speciesDescription}` : ''}
          ${briefDescription ? `Here is a brief description of the character that you should use as a starting point.
            THIS IS THE MOST IMPORTANT THING! EVEN MORE IMPORTANT THAN SPECIES DESCRIPTION/STEREOTYPES. YOUR GENERATED DESCRIPTION MUST
            INCLUDE ALL OF THESE FACTS. REQUIRED FACTS: ${briefDescription}` : ''}
          You should only take the world feeling and species description into account in ways that DO NOT contradict the other information.
        `;

    try {
      const imagePrompt = await getCompletion(system, prompt, 1, textModel) as { prompt: string } | undefined;

      if (!imagePrompt?.prompt) {
        return reply.status(500).send({ error: 'Failed to generate character image prompt due to an invalid response from the provider.' });
      }

      const imageUrl = await generateImage(imagePrompt.prompt, 'character-image', {}, imageModel);

      return { filePath: imageUrl } as GenerateCharacterImageOutput;
    } catch (error) {
      console.error('Error generating character image:', error);
      return reply.status(503).send({ error: `Failed to generate character image: ${(error as Error)?.message}` });
    }
  });
};

export default routes;

