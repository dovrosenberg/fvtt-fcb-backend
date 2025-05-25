/**
 * Randomly selects a name style from the provided array, or returns null if no styles provided
 */
export function selectRandomNameStyle(nameStyles?: string[]): string | null {
  if (!nameStyles || nameStyles.length === 0) {
    return null;
  }
  
  const randomIndex = Math.floor(Math.random() * nameStyles.length);
  return nameStyles[randomIndex];
}

/**
 * Generates the name instruction part of a prompt based on provided name and nameStyles
 */
export function generateNameInstruction(name?: string, nameStyles?: string[]): string {
  if (name) {
    return `The name is ${name}. You MUST ABSOLUTELY USE THIS NAME. DO NOT GENERATE YOUR OWN.`;
  }
  
  const selectedStyle = selectRandomNameStyle(nameStyles);
  if (selectedStyle) {
    return `When generating a name, it ABSOLUTELY MUST use this naming style: ${selectedStyle}`;
  }
  
  return '';
} 