// backend/middleware/auth.js
import jwt from 'jsonwebtoken';

// Use environment variable for JWT secret
const SECRET_KEY = process.env.JWT_SECRET || "your_jwt_secret_here";

// Auth middleware: checks Authorization header first, then session cookie
export const authMiddleware = (req, res, next) => {
  // 1) Authorization header
  const authHeader = req.headers.authorization;
  let token = null;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  }

  // 2) Fallback to cookie
  if (!token && req.cookies) {
    token = req.cookies.session_token;
  }

  if (!token) {
    return res.status(401).json({ message: 'Authorization token missing' });
  }

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    req.user = decoded; // attach decoded payload to request
    next();
  } catch (err) {
    console.warn('JWT verification failed:', err.message);
    return res.status(401).json({ message: 'Invalid token' });
  }
};
