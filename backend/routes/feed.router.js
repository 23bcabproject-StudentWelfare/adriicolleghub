import express from 'express';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';

const router = express.Router();

// ---------------------------
// Post Schema & Model
// ---------------------------
const PostSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  authorName: { type: String, required: true },
  content: { type: String, required: true, maxlength: 500 },
  type: { type: String, default: 'post', enum: ['post', 'announcement', 'event'] },
  timestamp: { type: Date, default: Date.now },
  likes: { type: Number, default: 0 },
  comments: { type: Number, default: 0 }
});

const Post = mongoose.models.Post || mongoose.model('Post', PostSchema);

// ---------------------------
// JWT Authentication Middleware
// ---------------------------
export const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: 'Access denied. No token provided.' });

  const token = authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Access denied. Invalid token format.' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'YOUR_JWT_SECRET');
    req.user = decoded; // decoded should include userId and fullName
    next();
  } catch (err) {
    return res.status(400).json({ message: 'Invalid token.' });
  }
};

// ---------------------------
// POST /api/feed/posts
// Create a new post
// ---------------------------
router.post('/posts', verifyToken, async (req, res) => {
  try {
  // Token payload from auth.routes sets { userId, username }
  const { userId, username } = req.user;
  const authorName = username || req.user.fullName || 'Unknown';
    const { content, type = 'post' } = req.body;

    if (!content || content.trim() === '') {
      return res.status(400).json({ message: 'Post content cannot be empty.' });
    }

  const newPost = new Post({ userId, authorName, content, type });
    await newPost.save();

    res.status(201).json(newPost);
  } catch (err) {
    console.error('Error creating post:', err);
    res.status(500).json({ message: 'Server error while creating post.' });
  }
});

// ---------------------------
// GET /api/feed/posts
// Get recent posts
// ---------------------------
router.get('/posts', verifyToken, async (req, res) => {
  try {
    const posts = await Post.find()
      .sort({ timestamp: -1 })
      .limit(50)
      .select('-__v');

    res.status(200).json(posts);
  } catch (err) {
    console.error('Error fetching posts:', err);
    res.status(500).json({ message: 'Server error while fetching posts.' });
  }
});

// ---------------------------
// GET /api/feed/posts/me
// Get posts for the currently authenticated user
// ---------------------------
router.get('/posts/me', verifyToken, async (req, res) => {
  try {
    // Support different token payload keys (userId or id)
    const currentUserId = req.user?.userId || req.user?.id || req.user?._id;
    if (!currentUserId) return res.status(400).json({ message: 'Unable to determine current user id from token.' });

    const posts = await Post.find({ userId: currentUserId })
      .sort({ timestamp: -1 })
      .limit(100)
      .select('-__v');

    res.status(200).json(posts);
  } catch (err) {
    console.error('Error fetching user posts:', err);
    res.status(500).json({ message: 'Server error while fetching user posts.' });
  }
});

export default router;
