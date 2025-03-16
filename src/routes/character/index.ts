import express from 'express';
import { generateCharacter } from '@/controllers';

const router = express.Router();

router.post('/generate', generateCharacter);

export default router;