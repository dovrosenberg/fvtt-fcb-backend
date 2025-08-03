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
    const { name, genre, settingFeeling, type, species, speciesDescription, briefDescription, longDescriptionParagraphs, nameStyles, textModel } = request.body;

    const system = generateEntitySystemPrompt('character', genre, settingFeeling);

    // see https://www.reddit.com/r/VoiceActing/comments/jwkufz/how_to_create_100_distinctly_different_voices/ for more info on voices
    const descriptionDefinition = generateDescriptionDefinition(`
            The role-play notes should be in the style of a brief NPC description for a tabletop RPG.
            Keep each section to a single short sentence or list.
            Avoid fictional character references or long explanations.
            Write clearly, vividly, and efficiently.
            THIS FIELD SHOULD NOT BE A NESTED JSON STRUCTURE - IT SHOULD JUST BE A STRING!  Follow this structure (SEPARATING SECTIONS AND ANY LISTS WITH \\n and MAKING SURE to include the field labels and asterisks):
            
            first line (don't include this header): a 1-sentence summary of who the NPC is and their general vibe.
            \\n**Appearance:** a 1-2 sentence description of their appearance suitable for description to players in a game.
            \\n**Voice:** generate a unique and easy-to-replicate voice style that does not rely on regional or ethnic accents. The voice should be suitable for tabletop roleplaying and easy for a Dungeon Master to repeat across sessions. Use the following elements to make it distinctive: 1) Pace: (e.g., slow, rapid, halting, smooth), 2) Tone: (e.g., gravelly, nasal, airy, booming, whispery), 3) Pitch: (e.g., high, low, medium), and 4) Rhythm or Quirk: (e.g., pauses often, speaks in rhyming phrases, repeats key words, ends sentences with a sigh or chuckle).  Combine those traits into a single sentence describes how the character sounds in a way that helps a DM perform the voice consistently. Avoid accents and instead focus on vocal characteristics and speech patterns.  For example: "\\n**Voice:** Speaks in a smooth, low tone with deliberate pacing, often pausing to choose their words and ending sentences with a knowing hum.
            \\n**Commonly used phrases:** several phrases they character might use repeatedly
            \\n**Personality snapshot:** list of 3 key traits separated by commas.
            \\n**Role-play hooks:** 2 tips on how to role-play them.
          `, longDescriptionParagraphs);

    const nameInstruction = generateNameInstruction(name, nameStyles);

    // \\n**Voice:** a suggestion to a non-professional voice actor about how to produce a distinct voice suitable for the character without an accent; this should have 5 parts: 1) one of the following basic voice types that describe each syllable: dabbing (light, direct, sudden), flicking (light, indirect, sudden), pressing (strong, direct, sustained), thrusting (strong, direct, sudden), wringing (strong, indirect, sustained), slashing (strong, indirect, sudden), gliding (light, direct, sustained), or floating (light, indirect, sustained), 2) nasally, throaty, or normal, 3) breathy or dry, 4) child (high pitch), adult, or old (raspy) voice, 5) overall speaking slowly, quickly, or normally

    const prompt = `
      I need you to suggest one name and two descriptions for a character. ${descriptionDefinition} 
      ${nameInstruction ? `${nameInstruction}` : ''}
      ${type ? `The type of character is a ${type}. Give this moderate weight.` : ''}
          ${species ? `It should be a description of a ${species}.` : ''}
          ${species && speciesDescription && species.trim()!==speciesDescription.trim() ? `Here is a description of what a ${species} is. Give it light weight: ${speciesDescription}` : ''}
          ${briefDescription ? `Here is a brief description of the character that you should use as a starting point.
            THIS IS THE MOST IMPORTANT THING! EVEN MORE IMPORTANT THAN SPECIES DESCRIPTION/STEREOTYPES. YOUR GENERATED DESCRIPTION MUST
            INCLUDE ALL OF THESE FACTS. REQUIRED FACTS: ${briefDescription}` : ''}
          You should only take the world feeling and species description into account in ways that do not contradict the other information.
        `;

    try {
      const result = (await getCompletion(system, prompt, 1, textModel)) as { name: string, roleplayNotes: string, longDescription: string } || { name: '', roleplayNotes: '', longDescription: ''};
      if (!result.name || !result.roleplayNotes || !result.longDescription) {
        return reply.status(500).send({ error: 'Failed to generate character due to an invalid response from the provider.' });
      }

      const character = {
        name: result.name,
        description: {
          roleplayNotes: result.roleplayNotes,
          long: result.longDescription,
        }
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
      ${species && speciesDescription && species.trim()!==speciesDescription.trim() ? `Here is a description of what a ${species} is. Give it light weight: ${speciesDescription}` : ''}
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

