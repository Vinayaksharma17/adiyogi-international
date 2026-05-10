import { verifyToken } from '@clerk/clerk-sdk-node';
import { env } from '../config/env.js';

export default function auth(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token provided' });

  verifyToken(token, { secretKey: env.CLERK_SECRET_KEY })
    .then((payload) => {
      req.admin = {
        id: payload.sub,
        clerkId: payload.sub,
        email: payload.email,
        name: payload.name,
      };
      next();
    })
    .catch((err) => {
      console.error('Clerk auth error:', err.message);
      res.status(401).json({ message: 'Invalid token' });
    });
}