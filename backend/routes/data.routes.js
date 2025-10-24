import express from 'express';
import { getUsers, getUserById, getUserFullContext } from '../controllers/data.controller.js';
import { authMiddleware } from '../middleware/auth.js'; // JWT middleware

const router = express.Router();

// Remove authMiddleware for public access
router.get('/context/:id', getUserFullContext);

// Public routes (optional: remove auth if intended)
router.get('/users', getUsers);
router.get('/users/:id', getUserById);

export default router;
