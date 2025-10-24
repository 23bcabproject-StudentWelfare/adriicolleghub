import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/user.model.js';

const router = express.Router();

// --------------------------
// Helper: Generate Unique Username
// --------------------------
const generateUniqueUsername = () => 'user_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

// --------------------------
// POST /api/auth/signup
// --------------------------
router.post('/signup', async (req, res) => {
  const { username, password, collegeName, universityName, major } = req.body;

  if (!username || !password || !collegeName || !universityName || password.length < 6) {
    return res.status(400).json({ message: "Username, password (min 6 chars), college name, and university name are required." });
  }

  try {
    // Check for existing user
    if (await User.findOne({ username })) {
      return res.status(409).json({ message: "Username already in use." });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Save new user
    const newUser = await User.create({
      username,
      password: hashedPassword,
      collegeName,
      universityName,
      major: major || "Undeclared"
    });

    // Mark user as online and log to terminal
    await User.findByIdAndUpdate(newUser._id, { isOnline: true });
    console.log(`User signed up: ${newUser.username} (${newUser._id}) from ${req.ip}`);

    // Create JWT and set session cookie
    const SECRET_KEY = process.env.JWT_SECRET || 'your_jwt_secret_here';
    const token = jwt.sign({ userId: newUser._id.toString(), username: newUser.username }, SECRET_KEY, { expiresIn: '1d' });

    res.cookie('session_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000 // 1 day
    });
    res.cookie('user_id', newUser._id.toString(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000 // 1 day
    });

    res.status(201).json({
      userId: newUser._id,
      token,
      message: "Signup successful!"
    });

  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ message: "Internal server error during signup." });
  }
});

// --------------------------
// POST /api/auth/login
// --------------------------
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ message: "Username and password required." });

  try {
    const user = await User.findOne({ username });
    if (!user) return res.status(401).json({ message: "Invalid username or password." });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: "Invalid username or password." });

    // Set session token and user_id in HTTP-only cookies
    // Mark user as online and log to terminal
    await User.findByIdAndUpdate(user._id, { isOnline: true });
    console.log(`User logged in: ${user.username} (${user._id}) from ${req.ip}`);

    // Create JWT and set session cookies
    const SECRET_KEY = process.env.JWT_SECRET || 'your_jwt_secret_here';
    const token = jwt.sign({ userId: user._id.toString(), username: user.username }, SECRET_KEY, { expiresIn: '1d' });

    res.cookie('session_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000 // 1 day
    });
    res.cookie('user_id', user._id.toString(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000 // 1 day
    });

    res.status(200).json({
      message: "Login successful!",
      userId: user._id,
      username: user.username,
      token
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Internal server error during login." });
  }
});

// --------------------------
// GET /api/auth/profile/:userId
// --------------------------
router.get('/profile/:userId', async (req, res) => {
  const { userId } = req.params;

  try {
    // Validate userId format to avoid CastError
    const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(userId);
    if (!isValidObjectId) {
      console.warn(`Profile fetch requested with invalid userId: ${userId}`);
      return res.status(400).json({ message: 'Invalid user ID format.' });
    }

    const user = await User.findById(userId).lean();
    if (!user) return res.status(404).json({ message: "User not found." });

    res.status(200).json({
      username: user.username,
      collegeName: user.collegeName,
      universityName: user.universityName,
      major: user.major,
      isOnline: user.isOnline,
      profilePicture: 'https://placehold.co/150x150/6fffb0/010409?text=User'
    });
  } catch (err) {
    console.error("Profile fetch error:", err);
    res.status(500).json({ message: "Internal server error fetching profile." });
  }
});

export default router;
