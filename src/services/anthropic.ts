import Anthropic from '@anthropic-ai/sdk';

let anthropic: Anthropic;

export const loadAnthropic = async function(): Promise<void> {
  if (!process.env.ANTHROPIC_API_KEY) {
    return;
  }

  anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY
  });

  if (!anthropic) {
    console.error('Issue initializing Anthropic API client');
  }
};

// temperature is rejected by the API (version 2026-10-21+), so the parameter is only used for logging
export const getCompletion = async(system: string, prompt: string, temperature: number, model: string): Promise<string | null> => {
  try {
    const response = await anthropic.messages.create({
      model: model,
      system: system,
      max_tokens: 16000,
      thinking: { type: 'disabled' }, // Haiku 5.5 thinks by default; only allowed at effort high or below (default is medium)
      messages: [{ role: 'user', content: prompt }],
    });

    // modern models think by default, so the first block may be a thinking block rather than the text
    const textBlock = response.content.find((block) => block.type === 'text');
    const resultText = textBlock ? textBlock.text.trim() : null;

    if (!resultText) {
      console.error(`Anthropic returned no text. stop_reason: ${response.stop_reason}`);
    }

    if (process.env.DEBUG) {
      console.log(`DEBUG: Ran completion.\nSystem: ${system}\nPrompt: ${prompt}\nTemperature: ${temperature}\nresult: ${resultText}`);
    }

    return resultText;
  } catch (error) {
    console.error('Error getting completion from Anthropic:', error);
    throw new Error(`Error getting completion from Anthropic: ${(error as Error).message}`);
  }
};
