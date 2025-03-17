import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

import { loadOpenAI } from '@/services/openai';
import { loadStorage } from '@/services/storage';
import { authenticate } from '@/middleware';
import routes from '@/routes';
import { version } from '../package.json';

const PORT = Number(process.env.PORT) || 8080;

void (async () => {
	console.log(`Starting server version ${version}`);
	const app = express();
	app.use(helmet());  // security best practices

	// have to allow all origins, but try to lock it down a bit
	app.use(cors({
		origin: '*',
		methods: ['GET', 'POST'],  
		allowedHeaders: ['Content-Type', 'Authorization']
	}));

	// parse JSON, URL encoded data
	app.use(express.json());  
	app.use(express.urlencoded({ extended: true }));

	// authenticate all routes
	app.use(authenticate);

	// attach routes
	app.use('/api', routes);

	// handle errors
	app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
		console.error(err.stack);
		res.status(500).json({ error: 'Internal Server Error' });
	});

	// setup any services
	await loadOpenAI();
	await loadStorage();

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

	app.listen(PORT, "0.0.0.0", () => console.log('Server running on http://0.0.0.0:${PORT}'));
})();