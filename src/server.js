require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const { Storage } = require('@google-cloud/storage');

const PORT = process.envPORT || 8080;

const app = express();
app.use(express.json());
app.use(cors());

const API_KEY = process.env.AI_API_KEY;
const API_PROVIDER = process.env.AI_PROVIDER;
const AUTH_TOKEN = process.env.FOUNDRY_API_TOKEN;
const GCS_BUCKET = process.env.GCS_BUCKET_NAME;

const storage = new Storage();
const bucket = storage.bucket(GCS_BUCKET);

// app.post('/generate-image', async (req, res) => {
//     if (req.headers.authorization !== `Bearer ${AUTH_TOKEN}`) {
//         return res.status(403).json({ error: "Unauthorized" });
//     }

//     try {
//         const response = await axios.post(`https://api.${API_PROVIDER}.com/generate`, {
//             prompt: req.body.prompt
//         }, {
//             headers: { Authorization: `Bearer ${API_KEY}` }
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
