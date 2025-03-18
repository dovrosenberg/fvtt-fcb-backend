import Fastify from 'fastify';
import helmet from '@fastify/helmet';
import cors from '@fastify/cors';
import  bearerAuthPlugin from '@fastify/bearer-auth';

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

	fastify.register(helmet);   // security best practices

	// have to allow all origins, but try to lock it down a bit
	fastify.register(cors, {
		origin: true,
		methods: ['GET', 'POST'],  
		allowedHeaders: ['Content-Type', 'Authorization']
	});

	// authenticate all routes
	fastify.register(bearerAuthPlugin, { keys: [process.env.API_TOKEN as string] });

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