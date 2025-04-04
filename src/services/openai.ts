import OpenAI from 'openai';

let openai: OpenAI;

const loadOpenAI = async function () {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });
};

const getCompletion = async (system: string, prompt: string, temperature: number): Promise<Record<string, any>> => {
  const fullSystem = `
    ${system}
    ALL OF YOUR RESPONSES MUST BE VALID JSON CAPABLE OF BEING PARSED BY JSON.parse() IN JAVASCRIPT.  THAT MEANS NO ESCAPE CHARACTERS OR NEW LINES
    OUTSIDE OF VALID STRINGS VALUES AND PROPERLY FORMED JSON WITH KEY VALUE PAIRS. 
    DO NOT ADD ANYTHING ELSE TO THE RESPONSE OTHER THAN WHAT IS DESCRIBED ABOVE. FOR EXAMPLE, A PROPERLY FORMED RESPONSE LOOKS LIKE:
    {"keyone":"value one", "keytwo":"Values can have newlines\n\nin them"}

  `;

  const chat_completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'system', content: fullSystem }, { role: 'user', content: prompt }],
    temperature: temperature,
  });

  //console.log(`prompt tokens: ${chat_completion.data.usage?.prompt_tokens}, response tokens: ${chat_completion.data.usage?.completion_tokens}`);
  const content = chat_completion.choices[0]?.message?.content;

  if (!content)
    return {};
  
  let response : Record<string, any> = {};
  try {
    response = JSON.parse(content) as Record<string, any>;
  } catch (_e) {
    // sometimes it comes up with escaped JSON strings... 
    try {
      response = JSON.parse(JSON.parse(JSON.stringify(content)));
    } catch (_e2) {
      throw new Error(`Error parsing response from GPT: System:${fullSystem}*** Prompt:${prompt}*** Response:${content}`);
    }
  }

  return response;
};

export { 
  openai,
  loadOpenAI,
  getCompletion
};