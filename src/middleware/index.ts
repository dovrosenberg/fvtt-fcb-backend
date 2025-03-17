import { Request, Response, NextFunction } from 'express';

// Mock authentication function
export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization;

  if (!token || token !== `Bearer ${process.env.API_TOKEN}`) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  next();
};
