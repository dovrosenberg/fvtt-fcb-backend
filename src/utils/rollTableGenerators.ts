import { getCompletion } from '@/services/llm';
import { TextModels } from '@/services/models';

interface PromptConfig {
  entityType: string;
  entityDescription: string;
  specificInstructions?: string;
  count: number;
  genre?: string;
  settingFeeling?: string;
  nameStyles?: string[];
  storeType?: string; // For stores specifically
  textModel?: TextModels;
}

export function generateSystemPrompt(config: PromptConfig): string {
  const { entityType, entityDescription, specificInstructions, count, nameStyles } = config;
  
  const cleanedNameStyles = nameStyles && nameStyles.length > 0 ? nameStyles : ['Classic'];

  // generate 30% extra because LLM won't get the count right
  const totalNames = Math.round(count * 1.3);

  let system = `
      You are a creative name generator for fictional ${entityDescription}.
      You will generate unique and appropriate ${entityType} names based on the provided parameters.${specificInstructions ? ` ${specificInstructions}` : ''}`;

  if (cleanedNameStyles.length > 1) {
    const namesPerStyle = Math.floor(totalNames / cleanedNameStyles.length);
    const remainder = totalNames % cleanedNameStyles.length;
    
    system += `\n\nYou MUST distribute the ${totalNames} names across the following naming styles:`;
    
    for (let i = 0; i < cleanedNameStyles.length; i++) {
      const countForThisStyle = namesPerStyle + (i < remainder ? 1 : 0);
      system += `\n${i + 1}. "${cleanedNameStyles[i]}" style: Generate EXACTLY ${countForThisStyle} names`;
    }
    
    system += '\n\nIMPORTANT: You must generate the exact number of names specified for each style. Mix the styles throughout your response - do NOT group all names of one style together.';
  } else {
    system += `\nThe names MUST follow the following naming style: "${cleanedNameStyles[0]}"`;
  }

  system += `\n\nEACH RESPONSE MUST BE A VALID JSON ARRAY OF STRINGS, CONTAINING EXACTLY ${totalNames} ${entityType.toUpperCase()} NAMES. 
      EACH RESPONSE SHOULD CONTAIN ONE FIELD:
      1. "names": AN ARRAY OF STRINGS, CONTAINING EXACTLY ${totalNames} ${entityType.toUpperCase()} NAMES.
    `;

  return system;
}

export function generateUserPrompt(config: PromptConfig): string {
  const { count, genre, settingFeeling, storeType, entityDescription } = config;
    
  let prompt = `
      Generate ${Math.round(count * 1.3)} unique ${entityDescription} names.      
      ${genre ? `The names should be appropriate for a ${genre} setting.` : ''}
      ${settingFeeling ? `The world has a feeling/atmosphere like: ${settingFeeling}` : ''}`;
  
  // Add store-specific instruction
  if (storeType) {
    prompt += `
      The stores are specifically ${storeType}s. Names MUST reflect this type of business.`;
  }
  
  prompt += `
      CRITICAL: If multiple naming styles were specified, you MUST follow the exact distribution requirements given in the system prompt. Do not generate all names in just one style.
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

  const result = await getCompletion(systemPrompt, userPrompt, 0.9, config.textModel) as { names: string[] } || { names: []};

  if (!result)
    return null;

  return {
    names: result.names.slice(0, config.count), // Final safety check to ensure exact count
  };
}