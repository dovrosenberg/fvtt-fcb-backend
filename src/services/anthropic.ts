import Anthropic from '@anthropic-ai/sdk';

let anthropic: Anthropic;

export const loadAnthropic = async function(): Promise<void> {
  anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY
  });

  if (!anthropic) {
    console.error('Issue initializing Anthropic API client');
  }
};

export const getCompletion = async(system: string, prompt: string, temperature: number, model: string): Promise<string | null> => {
  try {
    const response = await anthropic.messages.create({
      model: model,
      system: system,
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }],
      temperature: temperature,
    });

    const resultText = response.content[0].type === 'text' ? response.content[0].text.trim() : null;

    if (process.env.DEBUG) {
      console.log(`DEBUG: Ran completion.\nSystem: ${system}\nPrompt: ${prompt}\nTemperature: ${temperature}\nresult: ${resultText}`);
    }

    return resultText;
  } catch (error) {
    console.error('Error getting completion from Anthropic:', error);
    throw new Error(`Error getting completion from Anthropic: ${(error as Error).message}`);
  }
};
