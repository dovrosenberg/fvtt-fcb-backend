export enum ModelProvider {
  OpenAI,
  Anthropic,
  Replicate,
}

export enum TextModels {
  GPT_6_luna = 'GPT_6_luna',
  GPT_5_6_terra = 'GPT_5_6_terra',
  Claude_haiku_5_5 = 'Claude_haiku_5_5',

  // retired models; still accepted so saved settings keep working, but mapped to replacements and not listed
  GPT_5_mini = 'GPT_5_mini',
  GPT_4o_mini = 'GPT_4o_mini',
  Claude_3_haiku = 'Claude_3_haiku',
}

export enum ImageModels {
  Minimax_Image = 'Minimax_Image',
  Flux_1_1_Pro = 'Flux_1_1_Pro',
  Flux_Pro = 'Flux_Pro',
  Flux_Schnell_Lora = 'Flux_Schnell_Lora',
}

export const DEFAULT_TEXT_MODEL_ID = TextModels.Claude_haiku_5_5;
export const DEFAULT_IMAGE_MODEL_ID = ImageModels.Minimax_Image;


const gpt6Luna = {
  name: 'GPT-6 Luna',
  provider: ModelProvider.OpenAI,
  modelId: 'gpt-6-luna',
  description: 'From OpenAI. High-quality, $0.50/million output tokens, but subject to $5/year minimum. Best if you are using your OpenAI token for other things so the minimum doesn\'t matter',
};

const claudeHaiku55 = {
  name: 'Claude Haiku 5.5',
  provider: ModelProvider.Anthropic,
  modelId: 'claude-haiku-5-5',
  description: 'From Anthropic. High-quality, $0.50/million output tokens, but subject to $5/year minimum. Best if you are using your Anthropic token for other things so the minimum doesn\'t matter',
};

export const textModels = {
  [TextModels.GPT_6_luna]: gpt6Luna,
  [TextModels.GPT_5_6_terra]: {
    name: 'GPT-5.6 Terra',
    provider: ModelProvider.OpenAI,
    modelId: 'gpt-5.6-terra',
    description: 'From OpenAI. Higher quality, but $12/million output tokens (24x GPT-6 Luna), and subject to $5/year minimum',
  },
  [TextModels.Claude_haiku_5_5]: claudeHaiku55,
  [TextModels.GPT_5_mini]: { ...gpt6Luna, legacy: true },
  [TextModels.GPT_4o_mini]: { ...gpt6Luna, legacy: true },
  [TextModels.Claude_3_haiku]: { ...claudeHaiku55, legacy: true },
};

export const imageModels = {
  [ImageModels.Minimax_Image]: {
    name: 'Minimax Image',
    provider: ModelProvider.Replicate,
    modelId: 'minimax/image-01',
    description: 'From Replicate. High quality (almost always), but only $0.01',
  },
  [ImageModels.Flux_1_1_Pro]: {
    name: 'Flux 1.1 Pro',
    provider: ModelProvider.Replicate,
    modelId: 'black-forest-labs/flux-1.1-pro',
    description: 'From Replicate. Very fast (~10x Minimax), consistent, high-quality, $0.04 per image',
  },
  [ImageModels.Flux_Pro]: {
    name: 'Flux Pro',
    provider: ModelProvider.Replicate,
    modelId: 'black-forest-labs/flux-schnell',
    description: 'From Replicate. Fairly Fast, high quality, $0.055 per image.  Generally recommend 1.1 instead',
  },
  [ImageModels.Flux_Schnell_Lora]: {
    name: 'Flux Schnell Lora',
    provider: ModelProvider.Replicate,
    modelId: 'black-forest-labs/flux-schnell-lora',
    description: 'From Replicate. Fairly Fast, high quality, $0.055 per image.  Generally recommend 1.1 instead',
  },
};

// if we don't have a key in the config, leave that provider out
export const getTextModels = () => {
  return Object.entries(textModels)
    .filter(([, model]) => {
      if ('legacy' in model && model.legacy) {
        return false;
      }
      if (model.provider === ModelProvider.OpenAI) {
        return !!process.env.OPENAI_API_KEY;
      }
      if (model.provider === ModelProvider.Anthropic) {
        return !!process.env.ANTHROPIC_API_KEY;
      }
      return false;
    })
    .map(([id, model]) => ({
      id: id as TextModels,
      name: model.name,
      description: model.description,
    }));
};

export const getImageModels = () => {
  return Object.entries(imageModels)
    .filter(([, model]) => {
      if (model.provider === ModelProvider.Replicate) {
        return !!process.env.REPLICATE_API_KEY;
      }
      return false;
    })
    .map(([id, model]) => ({
      id: id as ImageModels,
      name: model.name,
      description: model.description,
    }));
};

