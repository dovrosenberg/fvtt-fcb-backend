import { FastifyInstance } from 'fastify';
import { getTextModels, getImageModels } from '@/services/models';
import { textModelsInputSchema, imageModelsInputSchema, TextModelsOutput, ImageModelsOutput } from '@/schemas/models';

async function modelRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.get('/text', { schema: textModelsInputSchema }, async (): Promise<TextModelsOutput> => {
    return { models: getTextModels() };
  });

  fastify.get('/image', { schema: imageModelsInputSchema }, async (): Promise<ImageModelsOutput> => {
    return { models: getImageModels() };
  });
}

export default modelRoutes;
