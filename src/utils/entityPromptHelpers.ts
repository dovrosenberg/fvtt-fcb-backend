/**
 * Generates a standard system prompt for entity generation
 */
export function generateEntitySystemPrompt(entityType: string, genre: string, worldFeeling?: string): string {
  return `
    I am writing a ${genre} novel. ${worldFeeling ? 'The feeling of the world is: ' + worldFeeling + '.\n' : ''} You are my assistant.
    EACH RESPONSE SHOULD CONTAIN TWO FIELDS:
    1. "name": A STRING CONTAINING ((ONLY)) THE NAME OF THE ${entityType.toUpperCase()} WE ARE DISCUSSING
    2. "description": A STRING CONTAINING ((ONLY)) A DESCRIPTION OF THE ${entityType.toUpperCase()} THAT MATCHES MY REQUEST
  `;
}

/**
 * Generates description format instructions for short vs long descriptions
 */
export function generateDescriptionDefinition(createLongDescription: boolean, shortFormat: string): string {
  return createLongDescription ?
    'The description should be 2-3 paragraphs long with paragraphs separated with \\n.' :
    shortFormat;
} 