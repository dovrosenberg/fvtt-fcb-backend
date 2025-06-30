import { storageProvider } from '@/services/storage';
import Replicate from 'replicate';
import { imageModels, DEFAULT_IMAGE_MODEL_ID } from './models';

// Replicate API client
let replicate: Replicate;

// Detailed model configurations specific to Replicate
const replicateImageModels = {
  'minimax/image-01': {
    promptTrigger: '4k, 8k, masterpiece, trending on artstation, detailed, cinematic',
    negativePrompt: 'ugly, disfigured, low quality, blurry, nsfw, text, watermark',
    outputFormat: 'jpeg',
    defaultOptions: {},
    getOptions: function(prompt: string) {
      return {
        prompt: `${prompt}, ${this.promptTrigger}`,
        negative_prompt: this.negativePrompt,
        ...this.defaultOptions,
      };
    },
  },
  'black-forest-labs/flux-1.1-pro': {
    promptTrigger: 'photorealistic, masterpiece, 8k, high quality',
    negativePrompt: 'blurry, low quality, nsfw, text, watermark, cartoon, anime, ugly',
    outputFormat: 'jpeg',
    defaultOptions: {},
    getOptions: function(prompt: string) {
      return {
        prompt: `${prompt}, ${this.promptTrigger}`,
        negative_prompt: this.negativePrompt,
        ...this.defaultOptions,
      };
    },
  },
  'black-forest-labs/flux-schnell': {
    promptTrigger: 'fast, high quality, detailed',
    negativePrompt: 'blurry, low quality, nsfw, text, watermark, ugly',
    outputFormat: 'jpeg',
    defaultOptions: {},
    getOptions: function(prompt: string) {
      return {
        prompt: `${prompt}, ${this.promptTrigger}`,
        negative_prompt: this.negativePrompt,
        ...this.defaultOptions,
      };
    },
  },
  'black-forest-labs/flux-schnell-lora': {
    promptTrigger: 'lora, stylized, high quality',
    negativePrompt: 'blurry, low quality, nsfw, text, watermark, ugly',
    outputFormat: 'jpeg',
    defaultOptions: {},
    getOptions: function(prompt: string) {
      return {
        prompt: `${prompt}, ${this.promptTrigger}`,
        negative_prompt: this.negativePrompt,
        ...this.defaultOptions,
      };
    },
  },
};

const loadReplicate = async function(): Promise<void> {
  if (!process.env.REPLICATE_API_KEY) {
    throw new Error('REPLICATE_API_KEY not set');
  }

  replicate = new Replicate({
    auth: process.env.REPLICATE_API_KEY,
  });

  if (!replicate)
    throw new Error('Failed to initialize Replicate');
};

/**
 * Generates an image using a Replicate model and stores it in the configured bucket
 * @returns URL to the generated image
 */
const generateImage = async (prompt: string, filenamePrefix: string, modelId: string,overrideOptions?: Record<string, any>): Promise<string> => {
  if (!replicate) {
    throw new Error('Replicate not loaded in generateImage()');
  }
  
  overrideOptions ||= {};

  try {
    // Get the detailed Replicate-specific model configuration
    const replicateModel = replicateImageModels[modelId as keyof typeof replicateImageModels];
    if (!replicateModel) {
      throw new Error(`Configuration for model ${modelId} not found in replicate.ts`);
    }

    // Prepare the request body for Replicate API
    const output = await replicate.run(modelId as keyof typeof replicateImageModels, { input: { ...replicateModel.getOptions(prompt), ...overrideOptions }});

    // Get the image URL or FileOutput object from the response
    const imageUrl = Array.isArray(output) ? output[0] : output;

    // Determine if we have a FileOutput object or a URL string
    const imageUrlString = typeof imageUrl === 'string'
      ? imageUrl
      : (imageUrl.url ? imageUrl.url() : imageUrl);

    // Fetch the image data
    const response = await fetch(imageUrlString);
    if (!response.ok) {
      throw new Error(`Failed to fetch image from Replicate: ${response.statusText}`);
    }

    const imageBuffer = Buffer.from(await response.arrayBuffer());

    // Generate a unique filename with the correct extension
    // put it in the fcb folder
    const fileName = `fcb/${filenamePrefix}-${Date.now()}.${replicateModel.outputFormat}`;

    // Save the image using the storage provider
    const publicUrl = await storageProvider.saveFile(
      fileName,
      imageBuffer,
      `image/${replicateModel.outputFormat}`
    );
    return publicUrl;
  } catch (error) {
    console.error('Error generating image with Replicate:', error);
    throw new Error(`Failed to generate image: ${(error as Error)?.message}`);
  }
};

export {
  loadReplicate,
  generateImage
};