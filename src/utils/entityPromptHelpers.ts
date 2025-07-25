/**
 * Generates a standard system prompt for entity generation
 */
export function generateEntitySystemPrompt(entityType: string, genre: string, settingFeeling?: string): string {
  return `
    I am writing a ${genre} novel. ${settingFeeling ? 'The feeling of the world is: ' + settingFeeling + '.\n' : ''} You are my assistant.
    EACH RESPONSE SHOULD CONTAIN THREE FIELDS:
    1. "name": A STRING CONTAINING ((ONLY)) THE NAME OF THE ${entityType.toUpperCase()} WE ARE DISCUSSING
    2. "roleplayNotes": A STRING CONTAINING ((ONLY)) THE ROLE-PLAYING NOTES
    3. "longDescription": A STRING CONTAINING ((ONLY)) THE LONG DESCRIPTION
  `;
}

/**
 * Generates description format instructions for short vs long descriptions
 */
export function generateDescriptionDefinition(shortFormat: string, paragraphCount: number = 1): string {
  const longDescriptionInstructions = `The longDescription should be ${paragraphCount} paragraph${paragraphCount > 1 ? 's' : ''} 
    long ${paragraphCount > 1 ? 'with paragraphs separated with \n.' : ''} A paragraph should be 5-6 sentences long.`;

  return `
    You need to generate two descriptions, role-play notes and a long one.
    The role-play notes should follow these rules: ${shortFormat}
    The longDescription should follow these rules: ${longDescriptionInstructions}
  `;
} 