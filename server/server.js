const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const Groq = require('groq-sdk');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const axios = require('axios'); // Needed for external API calls (News & YouTube)

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

// --- Database Connection ---
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB Connected'))
    .catch(err => console.log('MongoDB Connection Error:', err));

// --- Schemas ---

//cv schema

const cvSchema = new mongoose.Schema({

    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    title: {
        type: String,
        default: "Untitled CV"
    },

    resumeData: {
        type: Object,
        required: true
    }

}, { timestamps: true });


// User Schema (includes Academic & CV Profile Data)
const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    college: String,
    university: String,
    course: String,
    // CV / Profile Fields
    headline: { type: String, default: '' },
    skills: { type: [String], default: [] },
    experience: [{
        role: String,
        company: String,
        duration: String,
        description: String
    }],
    avatar: String,
    // Academic Tracking
    academicHistory: [{
        semester: Number,
        subjects: [{ name: String, mark: Number }],
        gpa: Number
    }],
    // AI Generated Syllabus Roadmap (Basic Structure)
    syllabus: { type: Array, default: [] }
});

// Community Tips Schema
const tipSchema = new mongoose.Schema({
    author: String,
    course: String,
    content: String,
    likes: { type: Number, default: 0 },
    date: { type: Date, default: Date.now }
});

const quizStatsSchema = new mongoose.Schema({

    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        unique: true
    },

    sets: {
        type: Number,
        default: 0
    },

    xp: {
        type: Number,
        default: 0
    },

    accuracy: {
        type: Number,
        default: 0
    }

}, { timestamps: true });

const User = mongoose.model('User', userSchema);
const Tip = mongoose.model('Tip', tipSchema);
const QuizStats = mongoose.model('QuizStats', quizStatsSchema);
const CV = mongoose.model("CV", cvSchema);
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// --- Helpers ---
// Robustly extract JSON from potentially messy AI text output
const extractJSON = (text) => {
    try {
        // Find the first '[' or '{' and last ']' or '}'
        const startBracket = text.indexOf('[');
        const startBrace = text.indexOf('{');
        const start = (startBracket !== -1 && (startBrace === -1 || startBracket < startBrace)) ? startBracket : startBrace;

        const endBracket = text.lastIndexOf(']');
        const endBrace = text.lastIndexOf('}');
        const end = (endBracket !== -1 && (endBrace === -1 || endBracket > endBrace)) ? endBracket : endBrace;

        if (start !== -1 && end !== -1) {
            return JSON.parse(text.substring(start, end + 1));
        }
        return JSON.parse(text);
    } catch (e) {
        console.error("JSON Extraction Failed:", e.message, text);
        return null; // Return null on failure
    }
};

// =========================================
// AUTHENTICATION ROUTES
// =========================================

// Signup - Creates user and generates initial basic syllabus structure
app.post('/api/signup', async (req, res) => {
    try {
        const { name, email, password, college, university, course } = req.body;

        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ error: "User already exists" });

        const hashedPassword = await bcrypt.hash(password, 10);

        // Generate Basic Syllabus Structure on Signup
        // Do NOT generate syllabus here
        // Leave empty, will generate when roadmap opens
        const newUser = new User({
            name,
            email,
            password: hashedPassword,
            college,
            university,
            course,
            syllabus: []
        });

        await newUser.save();

        res.status(201).json({ message: "User registered successfully!" });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// Login
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(400).json({ error: "Invalid credentials" });
        }
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
        user.password = undefined;
        res.json({ token, user });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// =========================================
// USER DATA ROUTES (Profile, Marks, Sync)
// =========================================

//cv post route

app.post("/api/cv", async (req, res) => {

    try {

        const { userId, title, resumeData } = req.body;

        const newCV = await CV.create({

            userId,
            title,
            resumeData

        });

        res.json(newCV);

    }
    catch (err) {

        res.status(500).json({
            error: err.message
        });

    }

});


//cv get route

app.get("/api/cv/user/:userId", async (req, res) => {

    try {

        const cvs = await CV.find({

            userId: req.params.userId

        }).sort({ updatedAt: -1 });

        res.json(cvs);

    }
    catch (err) {

        res.status(500).json({
            error: err.message
        });

    }

});
// load single cv by id (for editing in CV Builder)


app.get("/api/cv/:cvId", async (req, res) => {

    try {

        const cv = await CV.findById(req.params.cvId);

        res.json(cv);

    }
    catch (err) {

        res.status(500).json({
            error: err.message
        });

    }

});

//cv save route

app.put("/api/cv/:cvId", async (req, res) => {

    try {

        const cv = await CV.findByIdAndUpdate(
            req.params.cvId,
            {
                resumeData: req.body.resumeData,
                updatedAt: Date.now()
            },
            {
                new: true
            }
        );

        res.json(cv);

    }
    catch (err) {

        res.status(500).json({
            error: err.message
        });

    }

});


//interview get marks route

app.get("/api/quiz-stats/:userId", async (req, res) => {

    try {

        let stats = await QuizStats.findOne({
            userId: req.params.userId
        });

        // create if doesn't exist
        if (!stats) {

            stats = await QuizStats.create({
                userId: req.params.userId,
                sets: 0,
                xp: 0,
                accuracy: 0
            });

        }

        res.json(stats);

    }
    catch (err) {

        res.status(500).json({ error: err.message });

    }

});

//router save stats

app.put("/api/quiz-stats/:userId", async (req, res) => {

    try {

        const { sets, xp, accuracy } = req.body;

        const stats = await QuizStats.findOneAndUpdate(

            { userId: req.params.userId },

            {
                sets,
                xp,
                accuracy
            },

            {
                new: true,
                upsert: true
            }

        );

        res.json(stats);

    }
    catch (err) {

        res.status(500).json({ error: err.message });

    }

});


// =========================================
// GET OR GENERATE SYLLABUS (NEW)
// =========================================

app.get('/api/roadmap/syllabus/:userId', async (req, res) => {
    try {
        const user = await User.findById(req.params.userId).select('-password');

        if (!user) return res.status(404).json({ error: "User not found" });

        // ✅ IF syllabus exists → return it
        if (user.syllabus && user.syllabus.length > 0) {
            return res.json(user.syllabus);
        }

        // ❌ IF syllabus empty → generate using AI
        console.log("Syllabus empty. Generating with AI...");

        const prompt = `
Generate a structured syllabus roadmap for a "${user.course}" course at "${user.university}".

Return ONLY JSON array.

Format:
[
 {
   "semester": 1,
   "title": "Semester name",
   "modules": [
     {
       "code": "CS101",
       "title": "Module name",
       "topicsSummary": "Short summary"
     }
   ]
 }
]

Generate 6–8 semesters.
Each semester 4–6 modules.
`;

        const completion = await groq.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            model: "llama-3.3-70b-versatile",
            temperature: 0.3
        });

        const syllabusData = extractJSON(
            completion.choices[0]?.message?.content
        ) || [];

        if (!syllabusData.length)
            return res.status(500).json({ error: "AI failed to generate syllabus" });

        // ✅ SAVE to database
        user.syllabus = syllabusData;
        await user.save();

        console.log("Syllabus generated and saved");

        res.json(syllabusData);

    } catch (err) {
        console.error("Syllabus route error:", err);
        res.status(500).json({ error: "Failed to load syllabus" });
    }
});

// GET Single User (FIXES THE 404 SYNC ERROR IN DASHBOARD)
app.get('/api/user/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');
        if (!user) return res.status(404).json({ error: "User not found" });
        res.json(user);
    } catch (e) {
        console.error("Fetch user error:", e);
        res.status(500).json({ error: "Failed to fetch user" });
    }
});

// Update User Profile (Used for CV Builder & Settings)
app.put('/api/user/:id', async (req, res) => {
    try {
        delete req.body.password; delete req.body.email;
        const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true }).select('-password');
        res.json(user);
    } catch (e) { res.status(500).json({ error: "Update failed" }); }
});

// Delete User
app.delete('/api/user/:id', async (req, res) => {
    try { await User.findByIdAndDelete(req.params.id); res.json({ msg: "User deleted" }); } catch (e) { res.status(500).json({ error: "Delete failed" }); }
});

// Add/Update Semester Marks
app.post('/api/add-marks', async (req, res) => {
    try {
        const { userId, semester, subjects } = req.body;
        const totalMarks = subjects.reduce((acc, sub) => acc + Number(sub.mark), 0);
        const gpa = subjects.length > 0 ? parseFloat(((totalMarks / subjects.length) / 10).toFixed(2)) : 0;
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ error: "User not found" });
        user.academicHistory = user.academicHistory.filter(h => h.semester != semester);
        user.academicHistory.push({ semester, subjects, gpa });
        user.academicHistory.sort((a, b) => a.semester - b.semester);
        await user.save();
        res.json(user.select('-password'));
    } catch (e) { res.status(500).json({ error: "Failed to save marks" }); }
});

// =========================================
// AI FEATURES ROUTES (Groq)
// =========================================

// Generate Interview Question (Arena)
app.post('/api/get-interview', async (req, res) => {
    const { course, topic } = req.body;
    const prompt = `Create 1 single multiple-choice interview question for a ${course} student about the topic "${topic}". Return ONLY raw JSON. Format: {"question": "...", "options": ["A", "B"], "correctIndex": 0, "explanation": "..."}`;
    try {
        const completion = await groq.chat.completions.create({ messages: [{ role: "user", content: prompt }], model: "llama-3.3-70b-versatile" });
        res.json(extractJSON(completion.choices[0]?.message?.content));
    } catch (e) { res.status(500).json({ error: "Failed to generate question" }); }
});

// Generic AI Chat
app.post('/api/ai-chat', async (req, res) => {
    const { prompt, systemPrompt } = req.body;
    try {
        const completion = await groq.chat.completions.create({
            messages: [{ role: "system", content: systemPrompt || "You are a helpful academic AI assistant." }, { role: "user", content: prompt }],
            model: "llama-3.3-70b-versatile", temperature: 0.7
        });
        res.json({ reply: completion.choices[0]?.message?.content });
    } catch (err) { res.status(500).json({ error: "AI Service unavailable" }); }
});

// Generate Detailed Module Roadmap on Demand (For Celestial UI)
app.post('/api/roadmap/details', async (req, res) => {
    const { course, moduleTitle, topicsSummary } = req.body;
    try {
        if (!course || !moduleTitle) return res.status(400).json({ error: "Missing course or module data" });

        const prompt = `Generate a detailed, step-by-step learning roadmap for the module "${moduleTitle}" which is part of a "${course}" degree. The overview of topics is: "${topicsSummary || moduleTitle}".
        
        CRITICAL OUTPUT INSTRUCTIONS:
        1. Return ONLY raw JSON. No markdown formatting.
        2. The structure must be an array of subtopic objects.
        3. For each subtopic, provide a 'title', a specific 'description', and a 'youtubeQuery'.
        4. The 'youtubeQuery' must be a specific search string designed to find the best single tutorial video for that exact subtopic (e.g., "${course} ${moduleTitle} [subtopic name] tutorial").

        Example JSON Format:
        [
            { 
                "title": "Subtopic 1 Name", 
                "description": "Detailed explanation of what this subtopic covers...", 
                "youtubeQuery": "python data structures lists tutorial for beginners"
            },
            { ...next subtopic... }
        ]`;

        const completion = await groq.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            model: "llama-3.3-70b-versatile", temperature: 0.5
        });

        const detailsData = extractJSON(completion.choices[0]?.message?.content);
        if (!detailsData) throw new Error("Failed to parse AI response");
        res.json(detailsData);

    } catch (err) {
        console.error("Roadmap Details Error:", err);
        res.status(500).json({ error: "Failed to generate module details." });
    }
});


// =========================================
// EXTERNAL API PROXIES (News & Video)
// =========================================

app.get('/api/news', async (req, res) => {
    try {
        const topic = req.query.topic || 'technology'; const apiKey = process.env.GNEWS_API_KEY;
        if (!apiKey) return res.json([]);
        const url = `https://gnews.io/api/v4/search?q=${encodeURIComponent(topic)}&lang=en&sortby=publishedAt&max=10&apikey=${apiKey}`;
        const response = await axios.get(url); res.json(response.data.articles);
    } catch (error) { res.json([]); }
});

app.get('/api/videos', async (req, res) => {
    try {
        const topic = (req.query.topic || 'technology tutorial'); const apiKey = process.env.YOUTUBE_API_KEY;
        if (!apiKey) return res.json([]);
        // maxResults=1 for roadmap specific videos
        const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=1&q=${encodeURIComponent(topic)}&type=video&key=${apiKey}`;
        const response = await axios.get(url); res.json(response.data.items);
    } catch (error) { res.json([]); }
});


// =========================================
// COMMUNITY TIPS ROUTES
// =========================================
app.get('/api/tips', async (req, res) => { try { const tips = await Tip.find().sort({ date: -1 }).limit(20); res.json(tips); } catch (e) { res.status(500).json({ error: e.message }); } });
app.post('/api/tips', async (req, res) => { try { const newTip = new Tip(req.body); await newTip.save(); res.json(newTip); } catch (e) { res.status(500).json({ error: e.message }); } });
app.put('/api/tips/:id/like', async (req, res) => { try { const tip = await Tip.findById(req.params.id); if (!tip) return res.status(404).json({ error: "Tip not found" }); tip.likes += 1; await tip.save(); res.json(tip); } catch (e) { res.status(500).json({ error: e.message }); } });



// --- Server Start ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));