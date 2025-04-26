import { storageProvider } from '@/services/storage';
import Replicate from 'replicate';

// Replicate API client
let replicate: Replicate;

const loadReplicate = async function(): Promise<void> {
  replicate = new Replicate({
    auth: process.env.REPLICATE_API_KEY as string
  });

  if (!replicate) {
    console.error('Issue initializing Replicate API client');
  }
};

export const DEFAULT_MODEL = 0;
export const models = [
  // https://replicate.com/minimax/image-01?prediction=11hkfma171rme0cnvwpvn7tzac - Slow, variable (usually moderate to good) quality, but only $0.01
  // https://replicate.com/minimax/image-01?prediction=gnfvbzt46hrmc0cnvwv8zw69xw - scenery
  { 
    name: 'Minimax image-01', 
    modelId: 'minimax/image-01', 
    description: 'Slow, variable (usually moderate to good) quality, but only $0.01',
    outputFormat: 'jpg',
    getOptions: (prompt: string) => ({ 
      prompt: prompt,
      aspect_ratio: '3:4',
      number_of_images: 1,
      prompt_optimizer: true
    })
  },
  // https://replicate.com/black-forest-labs/flux-1.1-pro?prediction=bmahxcefn1rmc0cnvwraz0qk2w - fast, $0.04, high quality
  // https://replicate.com/black-forest-labs/flux-1.1-pro?prediction=74343jyypxrmc0cnvwss1s380c - scenery
  { 
    name: 'Flux 1.1 Pro', 
    modelId: 'black-forest-labs/flux-1.1-pro', 
    description: 'Fast, high-quality, $0.04 per image',
    outputFormat: 'webp',
    getOptions: (prompt: string) => ({ 
      prompt: prompt,
      aspect_ratio: '3:4',
      output_format: 'webp',
      output_quality: 80,
      safety_tolerance: 5,
      prompt_upsampling: true
    })
  },
  // https://replicate.com/black-forest-labs/flux-pro?prediction=xt8gs49dvhrmc0cnvwr8z7h5c0 - moderate speed, $0.55, high quality
  // https://replicate.com/black-forest-labs/flux-pro?prediction=g8v540vjfnrm80cnvwssdeam1c - scenery
  { 
    name: 'Flux Pro', 
    modelId: 'black-forest-labs/flux-schnell', 
    description: 'Fairly Fast, high-quality, $0.055 per image.  Generally recommend 1.1 instead',
    outputFormat: 'webp',
    getOptions: (prompt: string) => ({ 
      prompt: prompt,
      steps: 25,
      width: 1024,
      height: 1024,
      guidance: 3,
      interval: 2,
      aspect_ratio: '3:4',
      output_format: 'webp',
      output_quality: 80,
      safety_tolerance: 5,
      prompt_upsampling: false
    })
  },
  // https://replicate.com/black-forest-labs/flux-schnell-lora - fast, $.02, medium quality
  // https://replicate.com/black-forest-labs/flux-schnell-lora?prediction=jc61t5nw21rme0cnvwstmfm46m - scenery
  { 
    name: 'Flux Schnell LORA', 
    modelId: 'black-forest-labs/flux-schnell-lora', 
    description: 'Fairly Fast, high-quality, $0.055 per image.  Generally recommend 1.1 instead',
    outputFormat: 'webp',
    getOptions: (prompt: string) => ({ 
      prompt: prompt,
      go_fast: true,
      lora_scale: 0.8,
      megapixels: '1',
      num_outputs: 1,
      aspect_ratio: '3:4',
      lora_weights: 'fofr/flux-black-light',
      output_format: 'webp',
      output_quality: 80,
      num_inference_steps: 4
    })
  },
] as {
  name: string;
  modelId: `${string}/${string}` | `${string}/${string}:${string}`;
  description: string;
  outputFormat: string;
  getOptions: (prompt: string) => Record<string, any>;
}[];

/**
 * Generates an image using Replicate's flux-schnell model and stores it in the configured bucket
 * @returns URL to the generated image
 */
const generateImage = async (prompt: string, filenamePrefix: string, overrideOptions?: Record<string, any>, modelID?: number): Promise<string> => {
  if (!replicate) {
    throw new Error('Replicate not configured');
  }

  overrideOptions ||= {};

  try {
    // Prepare the request body for Replicate API
    const model = models[modelID ?? DEFAULT_MODEL];

    const output = await replicate.run(model.modelId, { input: { ...model.getOptions(prompt), ...overrideOptions }});

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
    const fileName = `fcb/${filenamePrefix}-${Date.now()}.${model.outputFormat}`;

    // Save the image using the storage provider
    const publicUrl = await storageProvider.saveFile(
      fileName,
      imageBuffer,
      `image/${model.outputFormat}`
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