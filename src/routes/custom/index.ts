import { getCompletion } from '@/services/llm';
import { FastifyInstance, FastifyReply, } from 'fastify';
import {
  ContentTypeDescriptions,
  generateCustomInputSchema,
  GenerateCustomOutput,
  GenerateCustomRequest,
} from '@/schemas';
import { generateCustomSystemPrompt } from '@/utils/entityPromptHelpers';
import { sanitizeHtml } from '@/utils/sanitizeHtml';


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
}

/**
 * Assemble the "master prompt" that wraps a user-provided (already-filled) instancePrompt
 * with strong, reusable instructions so the model returns clean, usable output.
 *
 * Goal: maximize consistency across many content types + user-configured fields.
 */
function buildMasterPrompt(request: GenerateCustomRequest): string {
  // Output shape constraints (sane defaults)
  const outputFormat = "HTML"; // "HTML" | "plain" - note: for now the system prompt always generates HTML 
  const minWords = 120;
  const maxWords = 250;
  const tone = "evocative, practical, table-ready";
  const tense = "present";
  const pov = "third-person";
  const contentRating = "PG-13";
  const includeHeadings = false;
  const includeBullets = true;
  const avoidListsLongerThan = 5;

  const { name, genre, contentType, settingFeeling, fieldLabel, type, species, speciesDescription, 
    parentName, parentType, parentDescription, grandparentName, grandparentType, 
    prompt, grandparentDescription, description, nameStyles } = request.body;

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
    - ${includeHeadings ? "You may use short headings if helpful." : "Do not add headings unless the user prompt explicitly asks for them."}
    - ${includeBullets ? `Bullets are allowed, but avoid lists longer than ${avoidListsLongerThan}.` : "Avoid bullets unless the user prompt explicitly asks for them."}
  `);

  // 3) Entity targeting (so the model knows what it’s writing “into”)
  blocks.push(`
    Context about the entity this request relates to: 
    - Entity type: ${contentType} - ${ContentTypeDescriptions[contentType!]}
    - Entity name: ${name}
    ${type ? `- Type: ${type}` : ''}
    ${description ? `- Description: ${description}` : ''}
    ${species ? `- Species: ${species}` : ''}
    ${speciesDescription ? `- Species Description: ${speciesDescription}` : ''}
    ${parentName ? `- Parent: ${parentName}` : ''}
    ${parentName && parentType ? `- Parent Type: ${parentType}` : ''}
    ${parentName && parentDescription ? `- Parent Description: ${parentDescription}` : ''}
    ${grandparentName ? `- Grandparent: ${grandparentName}` : ''}
    ${grandparentName && grandparentType ? `- Grandparent Type: ${grandparentType}` : ''}
    ${grandparentName && grandparentDescription ? `- Grandparent Description: ${grandparentDescription}` : ''}

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
