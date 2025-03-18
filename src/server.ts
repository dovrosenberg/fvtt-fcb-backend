import Fastify from 'fastify';
import helmet from '@fastify/helmet';
import cors from '@fastify/cors';
import swagger from '@fastify/swagger';
import swaggerUI from '@fastify/swagger-ui';

import { loadOpenAI } from '@/services/openai';
import { loadStorage } from '@/services/storage';
import routes from '@/routes';
import { version } from '../package.json';

const PORT = Number(process.env.PORT) || 8080;

void (async () => {
	console.log(`Starting server version ${version}`);

	// setup any services
	await loadOpenAI();
	await loadStorage();

	const fastify = Fastify({
		logger: {
			level: 'debug',   // 'info'
		}
	});

	// tell swagger plugin to start watching routes created
	await fastify.register(swagger, {
		openapi: {
			openapi: '3.0.0',
			info: {
				title: 'Test swagger',
				description: 'Testing the Fastify swagger API',
				version: '0.1.0'
			},
			servers: [
				{
					url: 'http://localhost:8080',
					description: 'Development server'
				}
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
	})

	// setup the swagger ui
	await fastify.register(swaggerUI, {
		routePrefix: '/documentation',
		uiConfig: {
			docExpansion: 'full',
			deepLinking: false,
			persistAuthorization: true,
		},
		staticCSP: true,
		transformStaticCSP: (header) => header,
		transformSpecification: (swaggerObject) => {
			return {
				...swaggerObject,
				security: [{ BearerAuth: [] }] // Apply auth globally in the UI
			}
		},
	})

	fastify.register(helmet);   // security best practices

	// have to allow all origins, but try to lock it down a bit
	fastify.register(cors, {
		origin: true,
		methods: ['GET', 'POST'],  
		allowedHeaders: ['Content-Type', 'Authorization']
	});

	// attach routes
	fastify.register(routes, { prefix: '/api' });

	// app.post('/generate-image', async (req, res) => {

	//     try {
	//         const response = await axios.post(`https://api.${API_PROVIDER}.com/generate`, {
	//             prompt: req.body.prompt
	//         }, {
	//             headers: { Authorization: `Bearer ${AI_API_KEY}` }
	//         });

	//         const imageBuffer = Buffer.from(response.data.image, 'base64');
	//         const fileName = `generated-${Date.now()}.png`;
	//         const file = bucket.file(fileName);

	//         await file.save(imageBuffer, { contentType: 'image/png' });
	//         const publicUrl = `https://storage.googleapis.com/${GCS_BUCKET}/${fileName}`;

	//         res.json({ imageUrl: publicUrl });
	//     } catch (error) {
	//         res.status(500).json({ error: error.message });
	//     }
	// });

	fastify.listen(
		{ 
			port: PORT,
			host: '0.0.0.0',
			listenTextResolver: (address) => { return `Server running on ${address}` }
		},
		(err: Error | null) => { if (err) throw err; }
	);
})();