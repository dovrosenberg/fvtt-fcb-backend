/** Makes text safe for use as a filename */
export function cleanText(text: string): string {
  return text.replace(/[^a-zA-Z0-9]/g, '_');
}