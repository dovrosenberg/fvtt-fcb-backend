/**
 * Generates a standard system prompt for entity generation
 * @param entityType The type of entity being generated
 * @param rpgStyle Whether the long description should be RPG text (true) or something more suitable for a novel (false)
 * @param genre The genre of the world
 * @param settingFeeling The feeling of the world
 */
export function generateEntitySystemPrompt(entityType: string, rpgStyle: boolean, genre: string, settingFeeling?: string): string {
  let intro = '';

  if (rpgStyle) {
    intro = `
      You are a the writer of an adventure module for a ${genre} tabletop role-playing game. 
      ${settingFeeling ? 'The feeling of the world is: ' + settingFeeling + '.\n' : ''} 
    `;
  } else {
    intro = `
      I am writing a ${genre} novel. ${settingFeeling ? 'The feeling of the world is: ' + settingFeeling + '.\n' : ''} You are my assistant.
    `;
  }

  return intro + `
      EACH RESPONSE SHOULD CONTAIN THREE FIELDS:
      1. "name": A STRING CONTAINING ((ONLY)) THE NAME OF THE ${entityType.toUpperCase()} WE ARE DISCUSSING
      2. "roleplayNotes": A STRING CONTAINING ((ONLY)) THE ROLE-PLAYING NOTES
      3. "longDescription": A STRING CONTAINING ((ONLY)) THE LONG DESCRIPTION
  `;
}

/**
 * Generates description format instructions for short vs long descriptions
 * @param shortFormat The list of sections for the short description
 * @param rpgStyle Whether the long description should be RPG text (true) or something more suitable for a novel (false)
 * @param rpgFormatBox a description of the boxed text content when using RPG style
 * @param rpgFormatNotes a description of the GM notes when using RPG style
 * @param paragraphCount The number of paragraphs for the long description
 */
export function generateDescriptionHeader(entityType: string, rpgStyle: boolean, rpgFormatBox: string, rpgFormatNotes: string, shortFormat: string, paragraphCount: number = 1): string {
  const rolePlayNotesInstructions = `
    The description should be in the style of a concise, fast-to-use ${entityType} description for a tabletop RPG. 
    Keep each section to a single short sentence or list.
    Avoid fictional comparisons or comparisons. Avoid long explanations.
    Keep it brief, vivid, and immediately usable at the table with original descriptions a game master can use at a glance.
    THIS FIELD SHOULD NOT BE A NESTED JSON STRUCTURE - IT SHOULD JUST BE A STRING!  Follow this structure (SEPARATING SECTIONS AND ANY LISTS WITH \\n and MAKING SURE to include the field labels and asterisks):
    ${shortFormat}
  `;

  let longDescriptionInstructions = '';
  if (rpgStyle) {
    longDescriptionInstructions = `
      The longDescription should have two, distinct sections.  Avoid filler, keep both sections practical and immediately game-ready. The sections are:
      1. Boxed Text (for players): A short, vivid description that a GM can read aloud. ${rpgFormatBox} Write in the present tense and keep it tight (3–6 sentences).
      2. GM Notes (for the DM only): Clear, concise bullet points or short paragraphs with: ${rpgFormatNotes}
    `;
  } else {
    longDescriptionInstructions = `
      The longDescription should be ${paragraphCount} paragraph${paragraphCount > 1 ? 's' : ''} 
      long ${paragraphCount > 1 ? 'with paragraphs separated with \n.' : ''} A paragraph should be no more than 6 sentences long.
    `;
  }
  
  longDescriptionInstructions += `  The longDescription should be ${paragraphCount} paragraph${paragraphCount > 1 ? 's' : ''} 
    long ${paragraphCount > 1 ? 'with paragraphs separated with \n.' : ''} A paragraph should be no more than 6 sentences long.`;

  return `
    You need to generate two descriptions: role-play notes and a long description.
    The role-play notes should follow these rules: ${rolePlayNotesInstructions}
    The longDescription should follow these rules: ${longDescriptionInstructions}
  `;
} 