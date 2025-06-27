export enum ModelProvider {
  OpenAI,
  Anthropic,
  Replicate,
}

export enum TextModels {
  GPT_4o_mini = 'GPT_4o_mini',
  Claude_3_haiku = 'Claude_3_haiku',
}

export enum ImageModels {
  Minimax_Image = 'Minimax_Image',
  Flux_1_1_Pro = 'Flux_1_1_Pro',
  Flux_Pro = 'Flux_Pro',
  Flux_Schnell_Lora = 'Flux_Schnell_Lora',
}

export const DEFAULT_TEXT_MODEL_ID = TextModels.GPT_4o_mini;
export const DEFAULT_IMAGE_MODEL_ID = ImageModels.Minimax_Image;


export const textModels = {
  [TextModels.GPT_4o_mini]: {
    name: 'GPT-4o Mini',
    provider: ModelProvider.OpenAI,
    modelId: 'gpt-4o-mini',
    description: 'From OpenAI. High-quality, $0.15/million tokens, but subject to $5/year minimum. Best if you are using your OpenAI token for other things so the minimum doesn\'t matter',
  },
  [TextModels.Claude_3_haiku]: {
    name: 'Claude 3 Haiku',
    provider: ModelProvider.Anthropic,
    modelId: 'claude-3-haiku-20240307',
    description: 'From Anthropic. High-quality, $0.25/million tokens, but subject to $5/year minimum. Best if you are using your Anthropic token for other things so the minimum doesn\'t matter',
  },
};

export const imageModels = {
  [ImageModels.Minimax_Image]: {
    name: 'Minimax Image',
    provider: ModelProvider.Replicate,
    modelId: 'minimax/image-01',
    description: 'From Replicate. Slow, variable (usually moderate to good) quality, but only $0.01',
  },
  [ImageModels.Flux_1_1_Pro]: {
    name: 'Flux 1.1 Pro',
    provider: ModelProvider.Replicate,
    modelId: 'black-forest-labs/flux-1.1-pro',
    description: 'From Replicate. Fast, high-quality, $0.04 per image',
  },
  [ImageModels.Flux_Pro]: {
    name: 'Flux Pro',
    provider: ModelProvider.Replicate,
    modelId: 'black-forest-labs/flux-schnell',
    description: 'From Replicate. Fairly Fast, high-quality, $0.055 per image.  Generally recommend 1.1 instead',
  },
  [ImageModels.Flux_Schnell_Lora]: {
    name: 'Flux Schnell Lora',
    provider: ModelProvider.Replicate,
    modelId: 'black-forest-labs/flux-schnell-lora',
    description: 'From Replicate. Fairly Fast, high-quality, $0.055 per image.  Generally recommend 1.1 instead',
  },
};

export const getTextModels = () => {
  return Object.entries(textModels).map(([id, model]) => ({
    id: id as TextModels,
    name: model.name,
    description: model.description,
  }));
};

export const getImageModels = () => {
  return Object.entries(imageModels).map(([id, model]) => ({
    id: id as ImageModels,
    name: model.name,
    description: model.description,
  }));
};

