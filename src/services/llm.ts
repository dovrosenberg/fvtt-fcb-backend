import { getCompletion as getAnthropicCompletion } from './anthropic';
import { getCompletion as getOpenAICompletion } from './openai';

import { textModels, ModelProvider, DEFAULT_TEXT_MODEL_ID, TextModels } from './models';


const tryParseJson = (str: string): unknown => {
  try {
    return JSON.parse(str);
  } catch (_e) {
    try {
      // Occasionally it's returned as a double-encoded string
      const reparsed = JSON.parse(JSON.parse(str));
      return reparsed;
    } catch (_e2) {
      if (process.env.DEBUG) {
        console.log('Error parsing JSON from LLM', str);
      }
      return null;
    }
  }
};

/** Run the completion against LLM API... will step down temperature if JSON comes back unformed */
const getCompletion = async (system: string, prompt: string, temperature: number, modelId?: TextModels | undefined): Promise<Record<string, any>> => {
  const fullSystem = `
    ${system}
    ALL OF YOUR RESPONSES MUST BE VALID JSON CAPABLE OF BEING PARSED BY JSON.parse() IN JAVASCRIPT.  THAT MEANS NO ESCAPE CHARACTERS OR NEW LINES
    OUTSIDE OF VALID STRINGS VALUES AND PROPERLY FORMED JSON WITH KEY VALUE PAIRS. 
    DO NOT ADD ANYTHING ELSE TO THE RESPONSE OTHER THAN WHAT IS DESCRIBED ABOVE. 
    FOR EXAMPLE, A PROPERLY FORMED RESPONSE LOOKS LIKE:
    {"keyone":"value one", "keytwo":"Values can have newlines\n\nin them"}
  `;

  return getCompletionWithTemperatureStepdown(fullSystem, prompt, temperature, modelId) as Record<string, any>;  
};

const getCompletionWithTemperatureStepdown = async(system: string, prompt: string, temperature: number, modelId?: TextModels | undefined): Promise<unknown> => {
  const finalModelId = modelId ?? DEFAULT_TEXT_MODEL_ID;
  const model = textModels[finalModelId];

  if (!model) {
    throw new Error(`Invalid modelId: ${modelId}`);
  }

  if (model.provider === ModelProvider.Anthropic && process.env.USE_ANTHROPIC === 'false') {
    throw new Error('Anthropic provider is disabled. Please enable it in your environment variables.');
  }

  if (model.provider === ModelProvider.OpenAI && process.env.USE_OPENAI === 'false') {
    throw new Error('OpenAI provider is disabled. Please enable it in your environment variables.');
  }

  // if we get back invalid JSON, try stepping down temperature
  const possibleStepDowns = [ 1.5, 1.3, 1.1, 1.0, 0.9, 0.75, 0.6 ];
  const fallbackTemperatures = [temperature];
  for (let i=0; i<possibleStepDowns.length; i++)
    if (possibleStepDowns[i] < temperature)
      fallbackTemperatures.push(possibleStepDowns[i]);

  for (const testTemp of fallbackTemperatures) {
    let content: string | null = null;

    if (model.provider === ModelProvider.OpenAI) {
      content = await getOpenAICompletion(system, prompt, testTemp, model.modelId);
    } else if (model.provider === ModelProvider.Anthropic) {
      content = await getAnthropicCompletion(system, prompt, testTemp, model.modelId);
    } else {
      throw new Error(`Unknown model provider for model ${model.modelId}`);
    }

    if (process.env.DEBUG) {
      console.log(content);
    }

    if (!content)
      continue;
    
    const parsed = tryParseJson(content);

    // set this manually in the GCP production "revision" if you want to see the raw response
    if (process.env.DEBUG==='true') {
      console.log(`DEBUG: Ran completion.\nSystem: ${system}\nPrompt: ${prompt}\nTemperature: ${testTemp}\nresult: ${content}`);
    }

    if (parsed !== null)
      return parsed;

    // if we got here, then we didn't get valid JSON back - try the next one
  }
  // if we got here nothing was valid - should be VERY rare because temp 0.6 should almost certainly wor
  throw new Error(`Error parsing response from LLM: System:${system}*** Prompt:${prompt}*** Temperature:${temperature}***}`);
};

/** This uses a different system prompt because the return response is different */
const getPreviewCompletion = async (namingStyles: string[], prompt: string, temperature: number): Promise<{ people: string[]; locations: string[]}[]> => {
  let previewSystem = `
    You are a creative name generator for fictional worlds.
    You will generate ${namingStyles.length} objects, each representing a different naming style.
    Each object MUST have two fields:
    1. "people": an array of 2 character names (first and last)
    2. "locations": an array of 2 place names (e.g. taverns, shops, landmarks)

    The ${namingStyles.length} naming styles you will use are:
  `;

  for (let i=0; i<namingStyles.length; i++) {
    previewSystem += `\n${i+1}. "${namingStyles[i]}"`;
  }

  previewSystem += `
    Your response MUST be a valid JSON array of 5 objects, in that order. Each object MUST contain exactly two arrays of two strings each, showcasing that naming style.
    Your response MUST be a valid JSON array of arrays. Each inner array must contain exactly two character names (as strings), showcasing that naming style.
    Do NOT add any commentary or extra formatting—ONLY return a JSON array of arrays that can be parsed by JSON.parse().
  `;

  return getCompletionWithTemperatureStepdown(previewSystem, prompt, temperature) as Promise<{ people: string[]; locations: string[]}[]>;  
};


export {
  getCompletion,
  getPreviewCompletion,
};
