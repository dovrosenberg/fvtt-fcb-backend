import { getCompletion } from '@/services/openai';

interface PromptConfig {
  entityType: string;
  entityDescription: string;
  specificInstructions?: string;
  count: number;
  genre?: string;
  worldFeeling?: string;
  nameStyles?: string[];
  storeType?: string; // For stores specifically
}

export function generateSystemPrompt(config: PromptConfig): string {
  const { entityType, entityDescription, specificInstructions, count, nameStyles } = config;
  
  const cleanedNameStyles = nameStyles && nameStyles.length > 0 ? nameStyles : ['Classic'];

  let system = `
      You are a creative name generator for fictional ${entityDescription}.
      You will generate unique and appropriate ${entityType} names based on the provided parameters.${specificInstructions ? ` ${specificInstructions}` : ''}
      The names MUST ALL COME FROM ${cleanedNameStyles.length > 1 ? 'one of the following naming styles, in roughly equal proportions' : 'the following naming style'}:`;
    
  for (let i = 0; i < cleanedNameStyles.length; i++) {
    system += `\n${i + 1}. "${cleanedNameStyles[i]}"`;
  }

  system += `\nEACH RESPONSE MUST BE A VALID JSON ARRAY OF STRINGS, CONTAINING EXACTLY ${Math.round(count * 1.3)} ${entityType.toUpperCase()} NAMES. 
      EACH RESPONSE SHOULD CONTAIN ONE FIELD:
      1. "names": AN ARRAY OF STRINGS, CONTAINING EXACTLY ${Math.round(count * 1.3)} ${entityType.toUpperCase()} NAMES.
    `;

  return system;
}

export function generateUserPrompt(config: PromptConfig): string {
  const { count, genre, worldFeeling, storeType, entityDescription } = config;
    
  let prompt = `
      Generate ${Math.round(count * 1.3)} unique ${entityDescription} names.      
      ${genre ? `The names should be appropriate for a ${genre} setting.` : ''}
      ${worldFeeling ? `The world has a feeling/atmosphere like: ${worldFeeling}` : ''}`;
  
  // Add store-specific instruction
  if (storeType) {
    prompt += `
      The stores are specifically ${storeType}s. Names MUST reflect this type of business.`;
  }
  
  prompt += `
      Ensure each name clearly fits one of the provided styles, and do not cluster all names of a single style together if more than one style is provided.
      Return ONLY a valid JSON array of strings. No explanations or extra text.
    `;

  return prompt;
}

export function generatePrompts(config: PromptConfig): { systemPrompt: string; userPrompt: string } {
  return {
    systemPrompt: generateSystemPrompt(config),
    userPrompt: generateUserPrompt(config)
  };
} 

export async function generateRollTableCompletions(config: PromptConfig): Promise<{ names: string[] } | null> {
  const { systemPrompt, userPrompt } = generatePrompts(config);

  const result = await getCompletion(systemPrompt, userPrompt, 0.9) as { names: string[] } || { names: []};

  if (!result)
    return null;

  return {
    names: result.names.slice(0, config.count), // Final safety check to ensure exact count
  };
}