import { getCompletion } from '@/services/openai';
import { generateImage } from '@/services/replicate';
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
  fastify.post('/generate', { schema: generateCharacterInputSchema }, async (request: GenerateCharacterRequest, _reply: FastifyReply): Promise<GenerateCharacterOutput> => {
    const { name, genre, worldFeeling, type, species, speciesDescription, briefDescription, createLongDescription, nameStyles } = request.body;

    const system = generateEntitySystemPrompt('character', genre, worldFeeling);

    const descriptionDefinition = generateDescriptionDefinition(createLongDescription || false, `
        The description should be in the style of a brief NPC description for a tabletop RPG.
        Keep each section to a single short sentence or list.
        Avoid fictional character references or long explanations.
        Write clearly, vividly, and efficiently.
        Follow this structure (SEPARATING SECTIONS AND ANY LISTS WITH \\n and MAKING SURE to include the field labels and asterisks):
        first line (don't include this header): a 1-sentence summary of who the NPC is and their general vibe.
        **Personality Snapshot:** list of 3 key traits separated by commas.
        **Roleplay Hooks:** 2 tips on how to roleplay them.
        **Appearance:** a quick description of their look.
      `);

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
      You should only take the world feeling into account in ways that do not contradict the other information.
    `;

    const result = (await getCompletion(system, prompt, 1)) as { name: string, description: string } || { name: '', description: ''};
    if (!result.name || !result.description) {
      throw new Error('Error in generateCharacter');
    }

    const character = {
      name: result.name,
      description: result.description
    } as GenerateCharacterOutput;

    return character;
  });

  // Add the new endpoint for generating character images
  fastify.post('/generate-image', { schema: generateCharacterImageInputSchema }, async (request: GenerateCharacterImageRequest, _reply: FastifyReply): Promise<GenerateCharacterImageOutput> => {
    const { genre, worldFeeling, name, type, species, speciesDescription, briefDescription, } = request.body;

    // Construct a detailed prompt 
    const prompt = `
      ${genre} character portrait ${name ? `of a character named ${name}` : ''},
      ${worldFeeling ? ` from a ${worldFeeling} world` :''}.
      ${species ? `, ${species}` : ''}.
      ${species && speciesDescription ? `(${speciesDescription})` : ''}.
      ${type ? `, ${type}` : ''}.
      ${briefDescription ? `, ${briefDescription}` : ''}.
      , fantasy art, photorealistic, cinematic lighting, ultra detail, sharp focus
    `;

    // TODO: consider if we should use GPT to create a better prompt vs the description

    try {
      const imageUrl = await generateImage(prompt, 'character-image');

      return { filePath: imageUrl } as GenerateCharacterImageOutput;
    } catch (error) {
      console.error('Error generating character image:', error);
      throw new Error(`Failed to generate character image: ${(error as Error)?.message}`);
    }
  });
};

export default routes;

