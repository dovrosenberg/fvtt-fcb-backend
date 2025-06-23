/**
 * Generates a standard system prompt for entity generation
 */
export function generateEntitySystemPrompt(entityType: string, genre: string, settingFeeling?: string): string {
  return `
    I am writing a ${genre} novel. ${settingFeeling ? 'The feeling of the world is: ' + settingFeeling + '.\n' : ''} You are my assistant.
    EACH RESPONSE SHOULD CONTAIN TWO FIELDS:
    1. "name": A STRING CONTAINING ((ONLY)) THE NAME OF THE ${entityType.toUpperCase()} WE ARE DISCUSSING
    2. "description": A STRING CONTAINING ((ONLY)) A DESCRIPTION OF THE ${entityType.toUpperCase()} THAT MATCHES MY REQUEST
  `;
}

/**
 * Generates description format instructions for short vs long descriptions
 */
export function generateDescriptionDefinition(createLongDescription: boolean, shortFormat: string, paragraphCount: number = 1): string {
  return createLongDescription ?
    `
    The description should be ${paragraphCount} paragraph${paragraphCount > 1 ? 's' : ''} long ${paragraphCount > 1 ? 'with paragraphs separated with \\n.' : ''}
    A paragraph should be 5-6 sentences long.
    ` :
    shortFormat;
} 