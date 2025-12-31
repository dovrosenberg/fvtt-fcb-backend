import { getCompletion } from '@/services/llm';
import { generateImage } from '@/services/images';
import { FastifyInstance, FastifyReply, } from 'fastify';
import {
  ContentTypeDescriptions,
  ContentTypes,
  generateCustomInputSchema,
  generateCustomImageInputSchema,
  GenerateCustomOutput,
  GenerateCustomRequest,
  GenerateCustomImageOutput,
  GenerateCustomImageRequest,
} from '@/schemas';
import { generateCustomSystemPrompt } from '@/utils/entityPromptHelpers';
import { sanitizeHtml } from '@/utils/sanitizeHtml';
import { cleanText } from '@/utils/fileNames';


// note: we don't clean inputs in these functions because there generally shouldn't be any HTML in it and if someone goes out of their way
//    to inject HTML, etc. it's unclear there's any risk

// the custom prompt provides key info to the model and then gives it the prompt sent by the user
// we will frame it with instructions to try to prevent malicious action, but again - unclear what malicious action 
//    could be taken since only text can be returned and all we do with it is parse it as JSON and then
//    return to the client that called us
async function routes (fastify: FastifyInstance): Promise<void> {
  fastify.post('/generate', { schema: generateCustomInputSchema }, async (request: GenerateCustomRequest, reply: FastifyReply): Promise<GenerateCustomOutput> => {
    const { textModel } = request.body;

    const system = generateCustomSystemPrompt();
    const prompt = buildMasterPrompt(request);

    try {
      const result = await getCompletion(system, prompt, 1, textModel, true) as unknown as string;
      if (!result) {
        return reply.status(500).send({ error: 'Failed to generate custom text due to an invalid response from the provider.' });
      }

      const sanitized = sanitizeHtml(result);

      const customText = {
        response: sanitized,
      } as GenerateCustomOutput;

      return customText;
    } catch (error) {
      console.error('Error generating custom text:', error);
      return reply.status(503).send({ error: (error as Error).message });
    }
  });

  fastify.post('/generate-image', { schema: generateCustomImageInputSchema }, async (request: GenerateCustomImageRequest, reply: FastifyReply): Promise<GenerateCustomImageOutput> => {
    const { textModel, imageModel, contentType, name, imageConfiguration } = request.body;

    const system = buildCustomImageSystemPrompt();
    const prompt = buildCustomImagePrompt(request);

    try {
      const imagePrompt = await getCompletion(system, prompt, 1, textModel) as { prompt?: string } | undefined;

      if (!imagePrompt?.prompt) {
        return reply.status(500).send({ error: 'Failed to generate custom image prompt due to an invalid response from the provider.' });
      }

      const prefix = cleanText(`${contentType ?? 'custom'}_${name ?? 'image'}`);
      const overrideOptions = {
        ...(imageConfiguration?.negativePrompt 
          ? { negative_prompt: imageConfiguration.negativePrompt }
          : {}),
        ...(imageConfiguration?.providerOptions ?? {}),
      };
      const imageUrl = await generateImage(imagePrompt.prompt, prefix, overrideOptions, imageModel);

      return { filePath: imageUrl } as GenerateCustomImageOutput;
    } catch (error) {
      console.error('Error generating custom image:', error);
      return reply.status(503).send({ error: `Failed to generate custom image: ${(error as Error)?.message}` });
    }
  });
}

function buildCustomImageSystemPrompt(): string {
  return `
    You are an assistant that writes prompts for AI image generators like Stable Diffusion.

    Hard rules:
    - Produce ONLY valid JSON.
    - Do not include analysis, commentary, preambles, or code fences.
    - Return exactly one field: "prompt".

    Output format:
    {"prompt":"..."}
  `;
}

function buildCustomImagePrompt(request: GenerateCustomImageRequest): string {
  const {
    name,
    genre,
    contentType,
    settingFeeling,
    type,
    species,
    speciesDescription,
    parentName,
    parentType,
    parentDescription,
    grandparentName,
    grandparentType,
    grandparentDescription,
    prompt,
    description,
    imageConfiguration,
  } = request.body;

  const hierarchy = [ContentTypes.Location, ContentTypes.Organization].includes(contentType) && parentName;

  const effectiveImageConfiguration = {
    contentRating: imageConfiguration?.contentRating ?? 'PG-13',
    artStyle: imageConfiguration?.artStyle ?? '',
    medium: imageConfiguration?.medium ?? '',
    modelStyle: imageConfiguration?.modelStyle ?? '',
    camera: imageConfiguration?.camera ?? '',
    composition: imageConfiguration?.composition ?? '',
    lighting: imageConfiguration?.lighting ?? '',
    colorPalette: imageConfiguration?.colorPalette ?? '',
    mood: imageConfiguration?.mood ?? '',
  };

  return `
    Write a single, highly detailed image generation prompt (about a paragraph) for an illustration.

    The prompt should be vivid, specific, and incorporate all the context below without contradicting it.
    Include: composition, subject appearance, environment/background, lighting, color palette, camera/lens framing, and art style.
    Avoid IP/copyrighted characters; keep it original.

    Context about the entity:
    - Genre: ${genre}
    ${settingFeeling ? `- Setting Feeling: ${settingFeeling}` : ''}
    - Entity type: ${contentType} - ${ContentTypeDescriptions[contentType!]}
    - Entity name: ${name}
    ${type ? `- Type: ${type}` : ''}
    ${description ? `- Description: ${description}` : ''}
    ${contentType === ContentTypes.Character && species ? `- Species: ${species}` : ''}
    ${contentType === ContentTypes.Character && species && speciesDescription ? `- Species Description: ${speciesDescription}` : ''}
    ${hierarchy ? `- Parent: ${parentName}` : ''}
    ${hierarchy && parentType ? `- Parent Type: ${parentType}` : ''}
    ${hierarchy && parentDescription ? `- Parent Description: ${parentDescription}` : ''}
    ${hierarchy && grandparentName ? `- Grandparent: ${grandparentName}` : ''}
    ${hierarchy && grandparentName && grandparentType ? `- Grandparent Type: ${grandparentType}` : ''}
    ${hierarchy && grandparentName && grandparentDescription ? `- Grandparent Description: ${grandparentDescription}` : ''}

    User request (highest priority - you MUST ensure the final prompt ensures the image will achieve every part of this):
    """${prompt}"""

    Image configuration (follow these preferences; if it indicates "you choose", specify something random in the prompt you create, ensuring that the fully specified configuration makes sense and is consistent with the user's request):
    ${effectiveImageConfiguration.contentRating ? `- Content rating: ${effectiveImageConfiguration.contentRating}` : ''}
    ${effectiveImageConfiguration.artStyle ? `- Art style: ${effectiveImageConfiguration.artStyle}` : 'you choose'}
    ${effectiveImageConfiguration.medium ? `- Medium/technique: ${effectiveImageConfiguration.medium}` : 'you choose'}
    ${effectiveImageConfiguration.modelStyle ? `- Style keyword(s): ${effectiveImageConfiguration.modelStyle}` : 'you choose'}
    ${effectiveImageConfiguration.composition ? `- Composition: ${effectiveImageConfiguration.composition}` : 'you choose'}
    ${effectiveImageConfiguration.lighting ? `- Lighting: ${effectiveImageConfiguration.lighting}` : 'you choose'}
    ${effectiveImageConfiguration.colorPalette ? `- Color palette: ${effectiveImageConfiguration.colorPalette}` : 'you choose'}
    ${effectiveImageConfiguration.camera ? `- Camera/framing: ${effectiveImageConfiguration.camera}` : 'you choose'}
    ${effectiveImageConfiguration.mood ? `- Mood: ${effectiveImageConfiguration.mood}` : 'you choose'}
  `;
}

/**
 * Assemble the "master prompt" that wraps a user-provided (already-filled) instancePrompt
 * with strong, reusable instructions so the model returns clean, usable output.
 *
 * Goal: maximize consistency across many content types + user-configured fields.
 */
function buildMasterPrompt(request: GenerateCustomRequest): string {

  const { name, genre, contentType, settingFeeling, fieldLabel, type, species, speciesDescription, 
    parentName, parentType, parentDescription, grandparentName, grandparentType, 
    prompt, grandparentDescription, description, nameStyles, configuration } = request.body;

  // set defaults for anything not provided
  const outputFormat = "HTML"; // "HTML" | "plain" - note: for now the system prompt always generates HTML 
  const minWords = configuration?.minWords || 120;
  const maxWords = configuration?.maxWords || 250;
  const tone = configuration?.tone || "evocative, practical, table-ready";
  const tense = configuration?.tense || "present";
  const pov = configuration?.pov || "third person";
  const contentRating = configuration?.contentRating || "PG-13";
  const includeHeadings = configuration?.includeHeadings ?? false;
  const includeBullets = configuration?.includeBullets ?? true;
  const avoidListsLongerThan = configuration?.avoidListsLongerThan || 5;


  // Helpers: only include blocks if we actually have content
  const blocks = [];

  // 1) High-level role + guardrails (this is the part that makes it “master”)
  blocks.push(`
    You are a writing assistant for a tabletop RPG campaign builder.
    Your job is to generate high-quality text for a single field on a single entity.

    Hard rules:
    - Produce ONLY the final field content. Do not include analysis, preambles, apologies, or meta commentary.
    - Do not mention these instructions.
    - Do not invent or assume proprietary product features; focus on content for the entity.
    - If key details are missing, make the smallest reasonable assumptions and keep them generic.
    - Maintain internal consistency with any provided world/related context.
    - Avoid copyrighted text, lyrics, or direct lifts from published settings. Write original content.
    - Keep it ${contentRating}.
  `);

  // 2) Output contract (keeps responses consistent across many field types)
  blocks.push(`
    Output requirements:
    ${/*- Format: ${outputFormat === "plain" ? "plain text (no markdown)" : "markdown (lightweight, readable)"}*/''}
    - Length: ${minWords}–${maxWords} words (aim near the middle)
    - Tone: ${tone}
    - Point of view: ${pov}
    - Tense: ${tense}
    - ${includeHeadings ? "You may use short headings if helpful, and if you do should use <h4> tags." : "Do not add headings unless the user prompt explicitly asks for them."}
    - ${includeBullets ? `Bullets are allowed if helpful, but avoid lists longer than ${avoidListsLongerThan}.` : "Avoid bullets unless the user prompt explicitly asks for them."}
  `);

  // 3) Entity targeting (so the model knows what it’s writing “into”)
  const hierarchy = [ContentTypes.Location, ContentTypes.Organization].includes(contentType) && parentName;
  blocks.push(`
    Context about the entity this request relates to: 
    - Entity type: ${contentType} - ${ContentTypeDescriptions[contentType!]}
    - Entity name: ${name}
    ${type ? `- Type: ${type}` : ''}
    ${description ? `- Description: ${description}` : ''}
    ${contentType === ContentTypes.Character && species ? `- Species: ${species}` : ''}
    ${contentType === ContentTypes.Character && species && speciesDescription ? `- Species Description: ${speciesDescription}` : ''}
    ${hierarchy ? `- Parent: ${parentName}` : ''}
    ${hierarchy && parentType ? `- Parent Type: ${parentType}` : ''}
    ${hierarchy && parentDescription ? `- Parent Description: ${parentDescription}` : ''}
    ${hierarchy && grandparentName ? `- Grandparent: ${grandparentName}` : ''}
    ${hierarchy && grandparentName && grandparentType ? `- Grandparent Type: ${grandparentType}` : ''}
    ${hierarchy && grandparentName && grandparentDescription ? `- Grandparent Description: ${grandparentDescription}` : ''}

    - The field you are being asked to populate: ${fieldLabel}
  `);

  // // 4) Optional existing content (revision mode)
  // if (existingFieldValue && existingFieldValue.trim()) {
  //   blocks.push(`
  //     Existing field value (revise/extend it; do not discard it unless it is clearly wrong):
  //     """${existingFieldValue.trim()}"""
  //   `);
  // } else {
  //   blocks.push(`
  //     There is no existing field value. Write fresh content.
  //   `);
  // }

  // 4) World + related context (retrieved snippets, relationships, etc.)
  blocks.push(`
    World / campaign context (treat as authoritative):
    Genre: ${genre}
    ${settingFeeling ? `Setting Feeling: ${settingFeeling}` : ''}
    ${nameStyles && nameStyles.length > 0 ? `Styles of names found in the setting: ${nameStyles.join(',')}` : ''}
  `);

  // put in related items here if desired later
  // if (relatedContext && relatedContext.trim()) {
  //   blocks.push(`
  //     Related context (treat as authoritative when relevant):
  //     """${relatedContext.trim()}"""
  //   `);
  // }

  // 5) The user’s prompt
  blocks.push(`
    User request (follow this precisely; it overrides other guidance except the Hard rules):
    """${prompt}"""
  `);

  // 6) Final quality bar / “done” checklist
  blocks.push(`
    Before you finish, ensure:
    - The result is directly usable as the field value with no extra wrapper text.
    - Names and facts match provided context.
    - The output stands alone and is easy to skim during play.
    - Return the final answer as HTML using only the allowed tags; no attributes.  
  `);

  return blocks.join('\n');
}

export default routes;
