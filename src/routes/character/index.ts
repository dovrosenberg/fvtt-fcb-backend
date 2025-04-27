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


// note: we don't clean briefDescription in these functions because there generally shouldn't be any HTML in it and if someone goes out of their way
//    to inject HTML, etc. it's unclear there's any risk

async function routes (fastify: FastifyInstance): Promise<void> {
  fastify.post('/generate', { schema: generateCharacterInputSchema }, async (request: GenerateCharacterRequest, _reply: FastifyReply): Promise<GenerateCharacterOutput> => {
    const { name, genre, worldFeeling, type, species, speciesDescription, briefDescription, createLongDescription } = request.body;

    const system =  `
      I am writing a ${genre} novel. ${worldFeeling ? 'The feeling of the world is: ' + worldFeeling + '.\n' : ''} You are my assistant.
      EACH RESPONSE SHOULD CONTAIN TWO FIELDS:
      1. "name": A STRING CONTAINING ((ONLY)) THE NAME OF THE CHARACTER WE ARE DISCUSSING
      2. "description": A STRING CONTAINING ((ONLY)) A DESCRIPTION OF THE CHARACTER THAT MATCHES MY REQUEST
    `;

    const descriptionDefinition = createLongDescription ?
      'The description should be 2-3 paragraphs long with paragraphs separated with <br/><br/>.' :
      `
        The description should be in the style of a brief NPC description for a tabletop RPG.
        Follow this structure:
        Tagline (1 sentence): a short summary of who the NPC is and their general vibe.
        Personality Snapshot (3 traits): list key traits separated by commas.
        Roleplay Hooks (2 bullet point): two tips on how to roleplay them.
        Appearance (1 sentence): a quick description of their look.
        Keep each section to a single short sentence or list.
        Avoid fictional character references or long explanations.
        Write clearly, vividly, and efficiently.      
      `;

    const prompt = `
      I need you to suggest one name and one description for a character.  ${descriptionDefinition}. 
      ${name ? `The name of character is ${name}. You MUST ABSOLUTELY USE THIS NAME. DO NOT GENERATE YOUR OWN.` : ''}.
      ${type ? `The type of character is a ${type}. Give this moderate weight.` : ''}.
      ${species ? `It should be a description of a ${species}.` : ''}.
      ${species && speciesDescription ? `Here is a description of what a ${species} is.  Give it light weight: ${speciesDescription}` : ''}.
      ${name ? `The name of the character is ${name}. You MUST use this name instead of creating a new one.` : ''}.
      ${briefDescription ? `Here is a brief description of the character that you should use as a starting point.
        THIS IS THE MOST IMPORTANT THING!  EVEN MORE IMPORTANT THAN SPECIES DESCRIPTION/STEREOTYPES.  YOUR GENERATED DESCRIPTION MUST
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

