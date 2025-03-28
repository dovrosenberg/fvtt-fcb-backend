import { getCompletion } from '@/services/openai';
import { FastifyInstance, FastifyReply, } from 'fastify';
import { generateOrganizationInputSchema, GenerateOrganizationRequest, GenerateOrganizationOutput } from '@/schemas';


// note: we don't clean briefDescription in these functions because there generally shouldn't be any HTML in it and if someone goes out of their way
//    to inject HTML, etc. it's unclear there's any risk

async function routes (fastify: FastifyInstance): Promise<void> {
  fastify.post('/generate', { schema: generateOrganizationInputSchema }, async (request: GenerateOrganizationRequest, _reply: FastifyReply): Promise<GenerateOrganizationOutput> => {
    const { genre, worldFeeling, type, briefDescription, parentName, parentType, parentDescription  } = request.body;
  
    const system =  `
      I am writing a ${genre} novel. ${worldFeeling ? 'The feeling of the world is: ' + worldFeeling + '.\n' : ''} You are my assistant.  
      ALL OF YOUR RESPONSES MUST BE VALID JSON.  EACH RESPONSE SHOULD CONTAIN TWO FIELDS:
      1. "name": A STRING CONTAINING ((ONLY)) THE NAME OF THE ORGANIZATION WE ARE DISCUSSING
      2. "description": A STRING CONTAINING ((ONLY)) A DESCRIPTION OF THE ORGANIZATION THAT MATCHES MY REQUEST
    `;
  
    const prompt = `
      I need you to suggest one name and one description for an organization.  The description should be 2-3 paragraphs long with paragraphs separated with \n. 
      ${type ? `The type of organization is a ${type}` : ''}.
      ${parentName ? `The organization is part of ${parentName + (parentType ? '(which is a ' + parentType + ')' : '')}.  ${(parentDescription ? `Here is some information about ${parentName}: ${parentDescription}.` : '.')}` : ''}
      ${briefDescription ? `Here is a brief description of the organization that you should use as a starting point.  Your description should include all of these facts: ${briefDescription}` : ''}
    `;
  
    const result = (await getCompletion(system, prompt, 1)) as { name: string, description: string } || { name: '', description: ''};
    if (!result.name || !result.description) {
      throw new Error('Error in gptGenerateOrganization');
    }
    
    const organization = {
      name: result.name,
      description: result.description,
    } as GenerateOrganizationOutput;
  
    return organization;
  });
}

export default routes;

