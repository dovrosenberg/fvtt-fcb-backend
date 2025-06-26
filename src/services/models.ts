export enum ModelProvider {
  OpenAI,
  Anthropic,
  Replicate,
}

export enum TextModels {
  GPT_4o_mini,
  Claude_3_haiku,
}

export enum ImageModels {
  Minimax_Image,
  Flux_1_1_Pro,
  Flux_Pro,
  Flux_Schnell_Lora,
}

export const DEFAULT_TEXT_MODEL_ID = TextModels.GPT_4o_mini;
export const DEFAULT_IMAGE_MODEL_ID = ImageModels.Minimax_Image;


export const textModels = [
  {
    name: 'GPT-4o Mini',
    provider: ModelProvider.OpenAI,
    modelId: 'gpt-4o-mini',
    description: 'High-quality, $0.15/million tokens, but subject to $5/year minimum. Best if you are using your OpenAI token for other things so the minimum doesn\'t matter',
  },
  {
    name: 'Claude 3 Haiku',
    provider: ModelProvider.Anthropic,
    modelId: 'claude-3-haiku-20240307',
    description: 'High-quality, $0.25/million tokens',
  },
];

export const imageModels = [
  {
    name: 'Minimax Image',
    provider: ModelProvider.Replicate,
    modelId: 'minimax/image-01',
    description: 'Slow, variable (usually moderate to good) quality, but only $0.01',
  },
  {
    name: 'Flux 1.1 Pro',
    provider: ModelProvider.Replicate,
    modelId: 'black-forest-labs/flux-1.1-pro',
    description: 'Fast, high-quality, $0.04 per image',
  },
  {
    name: 'Flux Pro',
    provider: ModelProvider.Replicate,
    modelId: 'black-forest-labs/flux-schnell',
    description: 'Fairly Fast, high-quality, $0.055 per image.  Generally recommend 1.1 instead',
  },
  {
    name: 'Flux Schnell Lora',
    provider: ModelProvider.Replicate,
    modelId: 'black-forest-labs/flux-schnell-lora',
    description: 'Fairly Fast, high-quality, $0.055 per image.  Generally recommend 1.1 instead',
  },
];
