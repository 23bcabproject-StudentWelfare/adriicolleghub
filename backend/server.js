// 1. Load environment variables from .env
import 'dotenv/config';
import express from 'express';
import cookieParser from 'cookie-parser';
import mongoose from 'mongoose';
import cors from 'cors';

// Routes
import authRoutes from './routes/auth.routes.js';
import dataRoutes from './routes/data.routes.js';
import feedRoutes from './routes/feed.router.js';

// --- Configuration & Initialization ---
const app = express();
const PORT = process.env.PORT || 5000;
const DB_URI = process.env.MONGODB_URI;

if (!DB_URI) {
  console.error("❌ FATAL ERROR: MONGODB_URI is not defined in .env");
  process.exit(1);
}

// --- Middlewares ---
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  methods: ['GET','HEAD','PUT','PATCH','POST','DELETE'],
  credentials: true
}));
app.use(express.json()); // Parse JSON requests
app.use(cookieParser());

// --- Routes ---
app.use('/api/auth', authRoutes);
app.use('/api/data', dataRoutes);
app.use('/api/feed', feedRoutes);

// Health check
app.get('/', (req, res) => {
  res.status(200).json({ message: "✅ CollegeHub Backend API running." });
});

// --- Database Connection & Server Start ---
// Clear any cached models to ensure fresh schema
mongoose.models = {};
mongoose.modelSchemas = {};

mongoose.connect(DB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => {
  console.log('✅ Connected to MongoDB Atlas');
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
})
.catch(err => {
  console.error('❌ MongoDB Atlas connection error:', err.message);
  process.exit(1);
});

// Optional: Handle unhandled rejections and exceptions
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason);
});
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});
