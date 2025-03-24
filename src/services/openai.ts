import OpenAI from 'openai';

let openai: OpenAI;

const loadOpenAI = async function () {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });
};

const getCompletion = async (system: string, prompt: string, temperature: number): Promise<Record<string, any>> => {
  const chat_completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'system', content: system }, { role: 'user', content: prompt }],
    temperature: temperature,
  });

  //console.log(`system: ${system}\nprompt: ${prompt}`);
  //console.log(`prompt tokens: ${chat_completion.data.usage?.prompt_tokens}, response tokens: ${chat_completion.data.usage?.completion_tokens}`);
  if (!chat_completion.choices[0].message?.content)
    return {};
  
  let response : Record<string, any> = {};
  try {
    response = JSON.parse(chat_completion.choices[0].message?.content) as Record<string, any>;
  } catch (_e) {
    // sometimes it comes up with escaped JSON strings... 
    try {
      response = JSON.parse(JSON.parse(JSON.stringify(chat_completion.choices[0].message.content)));
    } catch (_e2) {
      throw new Error(`Error parsing response from GPT: \vSystem:${system}\nPrompt:${prompt}\nResponse:${chat_completion.choices[0].message?.content}`);      
    }
  }

  return response;
};

export { 
  openai,
  loadOpenAI,
  getCompletion
};