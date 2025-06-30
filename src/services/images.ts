import { ModelProvider, ImageModels, DEFAULT_IMAGE_MODEL_ID, imageModels } from './models';
import { getReplicateImage } from './replicate';

/** Run the completion against LLM API... will step down temperature if JSON comes back unformed */
const generateImage = async (prompt: string, filenamePrefix: string, overrideOptions?: Record<string, any>, modelId?: ImageModels | undefined): Promise<string> => {
  const finalModelId = modelId ?? DEFAULT_IMAGE_MODEL_ID;
  const model = imageModels[finalModelId];

  if (model.provider === ModelProvider.Replicate) {
    return getReplicateImage(prompt, filenamePrefix, model.modelId, overrideOptions);
  } else {
    throw new Error(`Unknown model provider for model ${finalModelId}`);
  }

};

export {
  generateImage
};
