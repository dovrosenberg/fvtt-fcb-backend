import OpenAI from 'openai';

let openai: OpenAI;

const loadOpenAI = async function () {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });
};

/** Try to parse the json and handle common errors */
const tryParseJson = (content: string): Record<string, any> | null => {
  try {
    return JSON.parse(content);
  } catch {
    try {
      // Occasionally it's returned as a double-encoded string
      const reparsed = JSON.parse(JSON.parse(content));
      return reparsed;
    } catch {
      return null;
    }
  }
};

/** Run the completion against OpenAI.  Will step down the temperature until we get valid JSON back */
const getCompletionWithTemperatureStepdown = async(system: string, prompt: string, temperature: number): Promise<unknown> => {
  // if we get back invalid JSON, try stepping down temperature
  const possibleStepDowns = [ 1.5, 1.3, 1.1, 1.0, 0.9, 0.75, 0.6 ];
  const fallbackTemperatures = [temperature];
  for (let i=0; i<possibleStepDowns.length; i++)
    if (possibleStepDowns[i] < temperature)
      fallbackTemperatures.push(possibleStepDowns[i]);

  for (const testTemp of fallbackTemperatures) {
    const chat_completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'system', content: system }, { role: 'user', content: prompt }],
      temperature: testTemp,
    });

    //console.log(`prompt tokens: ${chat_completion.data.usage?.prompt_tokens}, response tokens: ${chat_completion.data.usage?.completion_tokens}`);
    const content = chat_completion.choices[0]?.message?.content?.trim();

    if (!content)
      continue;
    
    const parsed = tryParseJson(content);

    // set this manually in the production revision if you want to see the raw response
    if (process.env.DEBUG) {
      console.log(`DEBUG: Ran completion.\nSystem: ${system}\nPrompt: ${prompt}\nTemperature: ${testTemp}\nresult: ${content}`);
    }

    if (parsed !== null)
      return parsed;

    // if we got here, then we didn't get valid JSON back - try the next one
  }

  // if we got here nothing was valid - should be VERY rare because temp 0.6 should almost certainly work
  throw new Error(`Error parsing response from GPT: System:${system}*** Prompt:${prompt}*** Temperature:${temperature}***}`);
};


/** Run the completion against OpenAI API... will step down temperature if JSON comes back unformed */
const getCompletion = async (system: string, prompt: string, temperature: number): Promise<Record<string, any>> => {
  const fullSystem = `
    ${system}
    ALL OF YOUR RESPONSES MUST BE VALID JSON CAPABLE OF BEING PARSED BY JSON.parse() IN JAVASCRIPT.  THAT MEANS NO ESCAPE CHARACTERS OR NEW LINES
    OUTSIDE OF VALID STRINGS VALUES AND PROPERLY FORMED JSON WITH KEY VALUE PAIRS. 
    DO NOT ADD ANYTHING ELSE TO THE RESPONSE OTHER THAN WHAT IS DESCRIBED ABOVE. 
    FOR EXAMPLE, A PROPERLY FORMED RESPONSE LOOKS LIKE:
    {"keyone":"value one", "keytwo":"Values can have newlines\n\nin them"}
  `;

  return getCompletionWithTemperatureStepdown(fullSystem, prompt, temperature) as Record<string, any>;  
};


/** This uses a different system prompt because the return response is different */
const getPreviewCompletion = async (namingStyles: string[], prompt: string, temperature: number): Promise<{ people: string[]; locations: string[]}[]> => {
  let previewSystem = `
    You are a creative name generator for fictional worlds.
    You will generate ${namingStyles.length} objects, each representing a different naming style.
    Each object MUST have two fields:
    1. "people": an array of 2 character names (first and last or single name)
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
  openai,
  loadOpenAI,
  getCompletion,
  getPreviewCompletion,
};