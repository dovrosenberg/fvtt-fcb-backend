import { getCompletion } from '@/services/openai';
import { FastifyInstance, FastifyReply, } from 'fastify';
import { generateCharacterInputSchema, GenerateCharacterOutput, GenerateCharacterRequest } from '@/schemas';


// note: we don't clean briefDescription in these functions because there generally shouldn't be any HTML in it and if someone goes out of their way
//    to inject HTML, etc. it's unclear there's any risk

async function routes (fastify: FastifyInstance): Promise<void> {
  fastify.post('/generate', { schema: generateCharacterInputSchema }, async (request: GenerateCharacterRequest, _reply: FastifyReply): Promise<GenerateCharacterOutput> => {
    const { genre, worldFeeling, type, species, speciesDescription, briefDescription } = request.body;

    const system =  `
      I am writing a ${genre} novel. ${worldFeeling ? 'The feeling of the world is: ' + worldFeeling + '.\n' : ''} You are my assistant.  
      ALL OF YOUR RESPONSES MUST BE VALID JSON CAPABLE OF BEING PARSED BY JSON.parse() IN JAVASCRIPT.  THAT MEANS NO ESCAPE CHARACTERS OUTSIDE OF VALID STRINGS.
      EACH RESPONSE SHOULD CONTAIN TWO FIELDS:
      1. "name": A STRING CONTAINING ((ONLY)) THE NAME OF THE CHARACTER WE ARE DISCUSSING
      2. "description": A STRING CONTAINING ((ONLY)) A DESCRIPTION OF THE CHARACTER THAT MATCHES MY REQUEST
    `;

    const prompt = `
      I need you to suggest one name and one description for a character.  The description should be 2-3 paragraphs long with paragraphs separated with \\n. 
      ${type ? `The type of character is a ${type}. Give this moderate weight.` : ''}.
      ${species ? `It should be a description of a ${species}.` : ''}.
      ${species && speciesDescription ? `Here is a description of what a ${species} is.  Give it light weight: ${speciesDescription}` : ''}.
      ${briefDescription ? `Here is a brief description of the character that you should use as a starting point.  
        THIS IS THE MOST IMPORTANT THING!  EVEN MORE IMPORTANT THAN SPECIES DESCRIPTION/STEREOTYPES.  IT IS ABSOLUTELY CRITICAL THAT YOUR GENERATED DESCRIPTION 
        INCLUDE ALL OF THESE FACTS. REQUIRED FACTS: ${briefDescription}` : ''}
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
};

export default routes;

