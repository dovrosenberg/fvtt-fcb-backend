import { FastifyReply, } from 'fastify';
import { getCompletion } from '@/services/openai';
import { GenerateCharacterRequest, GenerateCharacterOutput} from '@/schemas';

// note: we don't clean briefDescription in these functions because there generally shouldn't be any HTML in it and if someone goes out of their way
//    to inject HTML, etc. it's unclear there's any risk

const generateCharacter = async (request: GenerateCharacterRequest, _reply: FastifyReply): Promise<GenerateCharacterOutput> => {
  const { genre, worldFeeling, type, species, briefDescription } = request.body;

  const system =  `
    I am writing a ${genre} novel. ${worldFeeling ? 'The feeling of the world is: ' + worldFeeling + '.\n' : ''} You are my assistant.  
    ALL OF YOUR RESPONSES MUST BE VALID JSON.  EACH RESPONSE SHOULD CONTAIN TWO FIELDS:
    1. "name": A STRING CONTAINING ((ONLY)) THE NAME OF THE CHARACTER WE ARE DISCUSSING
    2. "description": A STRING CONTAINING ((ONLY)) A DESCRIPTION OF THE CHARACTER THAT MATCHES MY REQUEST
  `;

  const prompt = `
    I need you to suggest one name and one description for a character.  The description should be 2-3 paragraphs long with paragraphs separated with <br/><br/>. 
    ${type ? 'The type of character is a ' + type + '. Give this only a little weight.' : ''}.
    ${species ? 'It should be a description of a ' + species : ''}.
    ${briefDescription ? 'Here is a brief description of the character that you should use as a starting point.  Your description should include all of these facts: ' + briefDescription : ''}
  `

  const result = (await getCompletion(system, prompt, 1)) as { name: string, description: string } || { name: '', description: ''};
  if (!result.name || !result.description) {
    throw new Error('Error in generateCharacter');
  }

  const character = {
    name: result.name,
    description: result.description
  } as GenerateCharacterOutput;

  return character;
};


// const gptGenerateOrganization = async function (_source: unknown, args: { worldId: ObjectId, type: string | null, parentId: ObjectId | null, briefDescription: string }, context: {userId: string}): Promise<ObjectId> {
//   const { worldId, type, parentId, briefDescription } = args;

//   // check authorization
//   if (!await hasAccessToWorld(context, worldId))
//     throw new Error('Unauthorized: gptGenerateOrganization');

//   let parent = '';
//   let parentType = '';
//   let parentDescription = '';
//   if (parentId) {
//     const parentOrg = (await organizationCollection.findOne({ worldId, _id: parentId }));

//     if (parentOrg) {
//       parent = parentOrg.name;
//       parentType = parentOrg.type || '';
//       parentDescription = parentOrg.description;
//     }
//   }

//   // get the genre and feeling of the world
//   const worldFeeling = await getWorldFeeling(worldId);

//   const system =  `
//     I am writing a ${worldFeeling.genre} novel. ${worldFeeling.feeling ? 'The feeling of the world is: ' + worldFeeling.feeling + '.\n' : ''} You are my assistant.  
//     ALL OF YOUR RESPONSES MUST BE VALID JSON.  EACH RESPONSE SHOULD CONTAIN TWO FIELDS:
//     1. "name": A STRING CONTAINING ((ONLY)) THE NAME OF THE ORGANIZATION WE ARE DISCUSSING
//     2. "description": A STRING CONTAINING ((ONLY)) A DESCRIPTION OF THE ORGANIZATION THAT MATCHES MY REQUEST
//   `;

//   const prompt = `
//     I need you to suggest one name and one description for an organization.  The description should be 2-3 paragraphs long with paragraphs separated with <br/><br/>. 
//     ${type ? 'The type of organization is a ' + type : ''}.
//     ${parent ? 'The organization is part of ' + parent + (parentType ? '(which is a ' + parentType + ')' : '') + '.  ' + (parentDescription ? 'Here is some information about ' + parent + ': ' + parentDescription + '.' : '.') : ''}
//     ${briefDescription ? 'Here is a brief description of the organization that you should use as a starting point.  Your description should include all of these facts: ' + briefDescription : ''}
//   `

//   let organizationId: ObjectId | null;
//   try {
//     const result = (await getCompletion(system, prompt, 1)) as { name: string, description: string } || { name: '', description: ''};
//     if (!result.name || !result.description) {
//       throw new Error('Error in gptGenerateOrganization');
//     }
  
//     organizationId = await createItem(null, {itemType: ItemType.Organization, worldId, name: result.name }, context);

//     if (!organizationId) {
//       throw new Error('Error in gptGenerateOrganization');
//     }

//     const organization = {
//       name: result.name,
//       description: result.description,
//       type: type || null,
//     } as OrganizationInput;

//     await updateOrganization(null, { worldId, _id: organizationId, organization }, context);
//     await setItemParent(null, { itemType: ItemType.Organization, worldId, childId: organizationId, parentId: parentId }, context);
//   } catch (e) {
//     throw new Error('Error in gptGenerateOrganization');
//   }  

//   return organizationId;
// }

// const gptGenerateLocation = async function (_source: unknown, args: { worldId: ObjectId, type: string | null, parentId: ObjectId | null, briefDescription: string }, context: {userId: string}): Promise<ObjectId> {
//   const { worldId, type, parentId, briefDescription } = args;

//   // check authorization
//   if (!await hasAccessToWorld(context, worldId))
//     throw new Error('Unauthorized: gptGenerateLocation');

//   // get 2 levels of parent, if they exist
//   let parent = '';
//   let parentType = '';
//   let parentDescription = '';
//   let grandparent = '';
//   let grandparentType = '';
//   let grandparentDescription = '';
//   if (parentId) {
//     const parentLoc = (await locationCollection.findOne({ worldId, _id: parentId }));

//     if (parentLoc) {
//       parent = parentLoc.name;
//       parentType = parentLoc.type || '';
//       parentDescription = parentLoc.description;

//       if (parentLoc.parent) {
//         const grandparentLoc = (await locationCollection.findOne({ worldId, _id: parentLoc.parent }));

//         if (grandparentLoc) {
//           grandparent = grandparentLoc.name;
//           grandparentType = grandparentLoc.type || '';
//           grandparentDescription = grandparentLoc.description;
//         }
//       }
//     }
//   }

//   // get the genre and feeling of the world
//   const worldFeeling = await getWorldFeeling(worldId);

//   const system =  `
//     I am writing a ${worldFeeling.genre} novel. ${worldFeeling.feeling ? 'The feeling of the world is: ' + worldFeeling.feeling + '.\n' : ''} You are my assistant.  
//     ALL OF YOUR RESPONSES MUST BE VALID JSON.  EACH RESPONSE SHOULD CONTAIN TWO FIELDS:
//     1. "name": A STRING CONTAINING ((ONLY)) THE NAME OF THE LOCATION WE ARE DISCUSSING
//     2. "description": A STRING CONTAINING ((ONLY)) A DESCRIPTION OF THE LOCATION THAT MATCHES MY REQUEST
//   `;

//   const prompt = `
//     I need you to suggest one name and one description for an location.  The description should be 2-3 paragraphs long with paragraphs separated with <br/><br/>. 
//     ${type ? 'The type of location is a ' + type : ''}.
//     ${parent ? 'The location is in ' + parent + (parentType ? '(which is a ' + parentType + ')' : '') + '.  ' + (parentDescription ? 'Here is some information about ' + parent + ': ' + parentDescription + '.' : '.') : ''}
//     ${grandparent ? parent + ' is located in ' + grandparent + (grandparentType ? '(which is a ' + grandparentType + ')' : '') + '.  ' + (grandparentDescription ? 'Here is some information about ' + grandparent + ': ' + grandparentDescription + '.' : '.') : ''}
//     ${briefDescription ? 'Here is a brief description of the location that you should use as a starting point.  Your description should include all of these facts: ' + briefDescription : ''}
//   `

//   let locationId: ObjectId | null;
//   try {
//     const result = (await getCompletion(system, prompt, 1)) as { name: string, description: string } || { name: '', description: ''};
//     if (!result.name || !result.description) {
//       throw new Error('Error in gptGenerateLocation');
//     }
  
//     locationId = await createItem(null, {itemType: ItemType.Location, worldId, name: result.name }, context);

//     if (!locationId) {
//       throw new Error('Error in gptGenerateLocation');
//     }

//     const location = {
//       name: result.name,
//       description: result.description,
//       type: type || null,
//     } as LocationInput;

//     await updateLocation(null, { worldId, _id: locationId, location }, context);
//     await setItemParent(null, { itemType: ItemType.Location, worldId, childId: locationId, parentId: parentId }, context);
//   } catch (e) {
//     throw new Error('Error in gptGenerateLocation');
//   }  

//   return locationId;
// }

// const gptGenerateSpecies = async function (_source: unknown, args: { worldId: ObjectId, type: string | null, parentId: ObjectId | null, briefDescription: string }, context: {userId: string}): Promise<ObjectId> {
//   const { worldId, type, parentId, briefDescription } = args;

//   // check authorization
//   if (!await hasAccessToWorld(context, worldId))
//     throw new Error('Unauthorized: gptGenerateSpecies');

//   let parent = '';
//   let parentType = '';
//   let parentDescription = '';
//   if (parentId) {
//     const parentSpec = (await speciesCollection.findOne({ worldId, _id: parentId }));

//     if (parentSpec) {
//       parent = parentSpec.name;
//       parentType = parentSpec.type || '';
//       parentDescription = parentSpec.description;
//     }
//   }

//   // get the genre and feeling of the world
//   const worldFeeling = await getWorldFeeling(worldId);

//   const system =  `
//     I am writing a ${worldFeeling.genre} novel. ${worldFeeling.feeling ? 'The feeling of the world is: ' + worldFeeling.feeling + '.\n' : ''} You are my assistant.  
//     ALL OF YOUR RESPONSES MUST BE VALID JSON.  EACH RESPONSE SHOULD CONTAIN TWO FIELDS:
//     1. "name": A STRING CONTAINING ((ONLY)) THE NAME OF THE SPECIES OR RACE WE ARE DISCUSSING
//     2. "description": A STRING CONTAINING ((ONLY)) A DESCRIPTION OF THE SPECIES OR RACE THAT MATCHES MY REQUEST
//   `;

//   const prompt = `
//     I need you to suggest one name and one description for a new species or race.  The species may be a humanoid, an animal, a monster, etc.  The description should be 2-3 paragraphs long with paragraphs separated with <br/><br/>. 
//     ${type ? 'The type of species is a ' + type : ''}.
//     ${parent ? 'The species is a subspecies of ' + parent + (parentType ? '(which is a ' + parentType + ')' : '') + '.  ' + (parentDescription ? 'Here is some information about ' + parent + ': ' + parentDescription + '.' : '.') : ''}
//     ${briefDescription ? 'Here is a brief description of the species that you should use as a starting point.  Your description should include all of these facts: ' + briefDescription : ''}
//   `

//   let speciesId: ObjectId | null;
//   try {
//     const result = (await getCompletion(system, prompt, 1)) as { name: string, description: string } || { name: '', description: ''};
//     if (!result.name || !result.description) {
//       throw new Error('Error in gptGenerateSpecies');
//     }
  
//     speciesId = await createItem(null, {itemType: ItemType.Species, worldId, name: result.name }, context);

//     if (!speciesId) {
//       throw new Error('Error in gptGenerateSpecies');
//     }

//     const species = {
//       name: result.name,
//       description: result.description,
//       type: type || null,
//     } as OrganizationInput;

//     await updateSpecies(null, { worldId, _id: speciesId, species }, context);
//     await setItemParent(null, { itemType: ItemType.Species, worldId, childId: speciesId, parentId: parentId }, context);
//   } catch (e) {
//     throw new Error('Error in gptGenerateSpecies');
//   }  

//   return speciesId;
// }

export {
  generateCharacter,
  // gptGenerateOrganization,
  // gptGenerateLocation,
  // gptGenerateSpecies,
}
