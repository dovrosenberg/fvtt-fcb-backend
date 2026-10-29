import OpenAI from 'openai';

let openai: OpenAI;

export const loadOpenAI = async function () {
  if (!process.env.OPENAI_API_KEY) {
    return;
  }

  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });

  if (!openai) {
    console.error('Issue initializing OpenAI API client');
  }
};

// temperature not supported in modern models, so we always set to 1 now
export const getCompletion = async(system: string, prompt: string, temperature: number, model: string): Promise<string | null> => {
  try {
    const chat_completion = await openai.chat.completions.create({
      model: model,
      messages: [{ role: 'system', content: system }, { role: 'user', content: prompt }],
      temperature: 1, // temperature not supported in modern models, so we always set to 1 now
      reasoning_effort: 'none' as unknown as OpenAI.ReasoningEffort, // SDK 4.x types lack 'none' but the API accepts it; blind-scored test showed reasoning didn't improve character output on gpt-6-luna or gpt-5.6-terra
    });

    if (process.env.DEBUG) {
      console.log(`DEBUG: Ran completion.\nSystem: ${system}\nPrompt: ${prompt}\nTemperature: ${temperature}\nresult: ${chat_completion.choices[0]}`);
    }

    return chat_completion.choices[0]?.message?.content?.trim() || null;
  } catch (error) {
    console.error('Error getting completion from OpenAI:', error);
    throw new Error(`Error getting completion from OpenAI: ${(error as Error).message}`);
  }
};