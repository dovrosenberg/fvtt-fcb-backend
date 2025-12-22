import Fastify from 'fastify';
import helmet from '@fastify/helmet';
import cors from '@fastify/cors';
import swagger from '@fastify/swagger';
import swaggerUI from '@fastify/swagger-ui';
import fastifyStatic from '@fastify/static';
import * as path from 'path';

import { loadOpenAI } from '@/services/openai';
import { loadAnthropic } from '@/services/anthropic';
import { loadStorage } from '@/services/storage';
import { loadReplicate } from '@/services/replicate';
import { loadGmail } from '@/services/gmail';
import routes from '@/routes';
import { version } from '../package.json';

const PORT = Number(process.env.PORT) || 8080;
const SERVER_URL = process.env.SERVER_URL || 'http://localhost:8080';

void (async () => {
  console.log(`Starting server version ${version}`);

  // setup any services
  if (process.env.OPENAI_API_KEY) {
    await loadOpenAI();
  }
  if (process.env.ANTHROPIC_API_KEY) {
    await loadAnthropic();
  }
  await loadStorage();
  await loadReplicate();
  await loadGmail();

  const fastify = Fastify({
    logger: {
      level: 'warn',   // 'info'
    }
  });

  // register fastify static to serve static files
  if (process.env.STORAGE_LOCAL_DIR) {
    fastify.register(fastifyStatic, {
      root: path.resolve('/app/files/'),
    });
  }

  // tell swagger plugin to start watching routes created
  await fastify.register(swagger, {
    openapi: {
      openapi: '3.0.0',
      info: {
        title: 'fvtt-fcb-backend',
        description: 'Backend for advanced capabilities for fvtt-campaign-builder Foundry module',
        version: version
      },
      servers: [
        {
          url: `${SERVER_URL}`,
          description: 'Foundry Campaign Builder Backend Server'
        }
      ],
      tags: [
        { name: 'FCB', description: 'All backend functions' },
      ],
      components: {
        securitySchemes: {
          'BearerAuth': {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'custom'
          }
        }
      },
      security: [{ BearerAuth: [] }], // Apply globally to ALL routes
    }
  });

  // setup the swagger ui
  await fastify.register(swaggerUI, {
    routePrefix: '/documentation',
    uiConfig: {
      docExpansion: 'full',
      deepLinking: true,
      persistAuthorization: true,
      displayRequestDuration: true, // Shows request time in UI
      defaultModelsExpandDepth: 2, // Ensures schema models are fully visible
      defaultModelExpandDepth: 2, // Expands individual schemas (important!)
      showCommonExtensions: true
    },
    staticCSP: true,
    transformStaticCSP: (header) => header,
    transformSpecification: (swaggerObject) => {
      return {
        ...swaggerObject,
        security: [{ BearerAuth: [] }] // Apply auth globally in the UI
      };
    },
  });

  /**
   * we relax security here and allow images inside /files folder to be embedded
   * DO NOT store sensitive info inside /files folder, only static images
  */
  fastify.register(helmet, {
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  }); // security best practices

  // have to allow all origins, but try to lock it down a bit
  fastify.register(cors, {
    origin: true,
    methods: ['GET', 'POST'],  
    allowedHeaders: ['Content-Type', 'Authorization']
  });

  // attach routes
  fastify.register(routes, { prefix: '/api' });

  fastify.listen(
    { 
      port: PORT,
      host: '0.0.0.0',
      listenTextResolver: (address) => { return `Server running on ${address}`; }
    },
    (err: Error | null) => { if (err) throw err; }
  );
})();
