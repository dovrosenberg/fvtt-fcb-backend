import { getCompletion } from '@/services/openai';
import { FastifyInstance, FastifyReply, } from 'fastify';
import { 
  generateLocationInputSchema, 
  GenerateLocationOutput, 
  GenerateLocationRequest,
  generateLocationImageInputSchema,
  GenerateLocationImageOutput,
  GenerateLocationImageRequest
} from '@/schemas';
import { generateImage } from '@/services/replicate';


// note: we don't clean briefDescription in these functions because there generally shouldn't be any HTML in it and if someone goes out of their way
//    to inject HTML, etc. it's unclear there's any risk

async function routes (fastify: FastifyInstance): Promise<void> {
  fastify.post('/generate', { schema: generateLocationInputSchema }, async (request: GenerateLocationRequest, _reply: FastifyReply): Promise<GenerateLocationOutput> => {
    const { genre, worldFeeling, type, briefDescription, name, parentName, parentType, parentDescription, grandparentName, grandparentType, grandparentDescription } = request.body;

    const system =  `
      I am writing a ${genre} novel. ${worldFeeling ? 'The feeling of the world is: ' + worldFeeling + '.\n' : ''} You are my assistant.  
      ALL OF YOUR RESPONSES MUST BE VALID JSON.  EACH RESPONSE SHOULD CONTAIN TWO FIELDS:
      1. "name": A STRING CONTAINING ((ONLY)) THE NAME OF THE LOCATION WE ARE DISCUSSING
      2. "description": A STRING CONTAINING ((ONLY)) A DESCRIPTION OF THE LOCATION THAT MATCHES MY REQUEST
    `;

    const prompt = `
      I need you to suggest one name and one description for an location.  The description should be 2-3 paragraphs long with paragraphs separated with \n. 
      ${name ? `The name of character is ${name}. You MUST ABSOLUTELY USE THIS NAME. DO NOT GENERATE YOUR OWN.` : ''}.
      ${type ? `The type of location is a ${type}` : ''}.
      ${parentName ? `The location is in ${parentName + (parentName ? '(which is a ' + parentType + ')' : '') + '.  ' + (parentDescription ? 'Here is some information about ' + parentName + ': ' + parentDescription + '.' : '.')}` : ''}
      ${grandparentName ? `${parent} is located in ${grandparentName + (grandparentType ? '(which is a ' + grandparentType + ')' : '')}. ${(grandparentDescription ? 'Here is some information about ' + grandparentName + ': ' + grandparentDescription + '.' : '.')}` : ''}
      ${briefDescription ? `Here is a brief description of the location that you should use as a starting point.
        THIS IS THE MOST IMPORTANT THING!  YOUR GENERATED DESCRIPTION MUST
        INCLUDE ALL OF THESE FACTS. REQUIRED FACTS: ${briefDescription}` : ''}
      You should only take the world feeling into account in ways that do not contradict the other information.
    `;

    const result = (await getCompletion(system, prompt, 1)) as { name: string, description: string } || { name: '', description: ''};
    if (!result.name || !result.description) {
      throw new Error('Error in gptGenerateLocation');
    }

    const location = {
      name: result.name,
      description: result.description,
      type: type || null,
    } as GenerateLocationOutput;

    return location;
  });

  fastify.post('/generate-image', { schema: generateLocationImageInputSchema }, async (request: GenerateLocationImageRequest, _reply: FastifyReply): Promise<GenerateLocationImageOutput> => {
    const { genre, worldFeeling, name, type, parentName, parentType, parentDescription, briefDescription, } = request.body;

    // Construct a detailed prompt 
    const prompt = `
      ${genre} scnery ${name ? `of a location named ${name}` : ''},
      ${worldFeeling ? ` from a ${worldFeeling} world` :''}.
      ${parentName ? `The location is in ${parentName + (parentName ? '(which is a ' + parentType + ')' : '') + '.  ' + (parentDescription ? 'Here is some information about ' + parentName + ': ' + parentDescription + '.' : '.')}` : ''}
      ${type ? `, ${type}` : ''}.
      ${briefDescription ? `, ${briefDescription}` : ''}.
      , fantasy art, photorealistic, cinematic lighting, ultra detail, sharp focus
    `;

    // TODO: consider if we should use GPT to create a better prompt vs the description

    try {
      const imageUrl = await generateImage(prompt);

      return { filePath: imageUrl } as GenerateLocationImageOutput;
    } catch (error) {
      console.error('Error generating character image:', error);
      throw new Error(`Failed to generate character image: ${(error as Error)?.message}`);
    }
  });
}

export default routes;

