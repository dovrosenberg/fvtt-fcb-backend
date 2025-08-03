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

export const getCompletion = async(system: string, prompt: string, temperature: number, model: string): Promise<string | null> => {
  try {
    const chat_completion = await openai.chat.completions.create({
      model: model,
      messages: [{ role: 'system', content: system }, { role: 'user', content: prompt }],
      temperature: temperature,
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