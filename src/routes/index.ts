import express from 'express';
import characterRoutes from './character';

const router = express.Router();

router.use('/characters', characterRoutes);

export default router;