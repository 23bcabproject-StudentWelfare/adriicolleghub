// ===========================================
// ✅ Corrected MongoDB + Mongoose Schema File (ESM Version)
// ===========================================

import mongoose from "mongoose";
import bcrypt from "bcryptjs";

// ✅ Replace with your actual MongoDB connection string
const MONGODB_URI =
  "mongodb+srv://23bcabproject_db_user:VPfFwk88SkbMdGqq@cluster0.yw1g0eo.mongodb.net/?appName=Cluster0";

// =======================================================
// --- Mongoose Schemas ---
// =======================================================

// 1️⃣ User Schema
const UserSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true, trim: true },
    password: { type: String, required: true, minlength: 6 },
    collegeName: { type: String, required: true },
    universityName: { type: String, required: true },
    major: { type: String, default: "Undeclared" },
    isOnline: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// 2️⃣ Course Schema
const CourseSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true },
    code: { type: String, required: true },
    semester: { type: String, required: true },
    finalGrade: { type: String, default: "N/A" },
  },
  { timestamps: true }
);

// 3️⃣ Assignment Schema
const AssignmentSchema = new mongoose.Schema(
  {
    course: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
    name: { type: String, required: true },
    dueDate: { type: Date, required: true },
    type: { type: String, enum: ["Assignment", "Exam", "Quiz", "Project"], required: true },
    status: { type: String, enum: ["Pending", "Completed", "Graded"], default: "Pending" },
    score: { type: Number, default: null },
    maxScore: { type: Number, default: 100 },
  },
  { timestamps: true }
);

// 4️⃣ ChatRoom Schema
const ChatRoomSchema = new mongoose.Schema(
  {
    isPrivate: { type: Boolean, default: false },
    name: { type: String, trim: true, default: null },
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    course: { type: mongoose.Schema.Types.ObjectId, ref: "Course", default: null },
    lastMessage: { type: mongoose.Schema.Types.ObjectId, ref: "Message", default: null },
  },
  { timestamps: true }
);

// 5️⃣ Message Schema
const MessageSchema = new mongoose.Schema(
  {
    chatRoom: { type: mongoose.Schema.Types.ObjectId, ref: "ChatRoom", required: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    content: { type: String, trim: true, required: true },
    messageType: { type: String, enum: ["text", "image", "link"], default: "text" },
  },
  { timestamps: true }
);

// 6️⃣ Event Schema
const EventSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true },
    description: String,
    date: { type: Date, required: true },
    eventType: {
      type: String,
      enum: ["Deadline", "Milestone", "Appointment", "Holiday", "Other"],
      default: "Milestone",
    },
  },
  { timestamps: true }
);

// 7️⃣ Performance Analysis Schema
const PerformanceAnalysisSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    trend: { type: String, required: true },
    predictedNextTerm: { type: Map, of: Number, required: true },
    strengths: [String],
    weaknesses: [String],
    aiSummary: { type: String, required: true },
    aiModel: { type: String, default: "LSTM_v1.0" },
    analysisDate: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// =======================================================
// --- Model Registration ---
// =======================================================
const User = mongoose.model("User", UserSchema);
const Course = mongoose.model("Course", CourseSchema);
const Assignment = mongoose.model("Assignment", AssignmentSchema);
const ChatRoom = mongoose.model("ChatRoom", ChatRoomSchema);
const Message = mongoose.model("Message", MessageSchema);
const Event = mongoose.model("Event", EventSchema);
const PerformanceAnalysis = mongoose.model("PerformanceAnalysis", PerformanceAnalysisSchema);

// =======================================================
// --- Utility: Generic Insert Function ---
// =======================================================
const insertData = async (Model, data) => {
  try {
    await Model.deleteMany({});
    if (data && data.length > 0) {
      await Model.insertMany(data, { ordered: false });
      console.log(`✅ Inserted ${data.length} into ${Model.modelName}`);
    } else {
      console.log(`⚠️ No data provided for ${Model.modelName}, skipping.`);
    }
  } catch (err) {
    console.error(`❌ Error inserting into ${Model.modelName}:`, err.message);
  }
};

// =======================================================
// --- Main Seeder Function ---
// =======================================================
const seedDatabase = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("🔗 Connected to MongoDB successfully.");

    // Sample placeholder data
    const hashedPassword = await bcrypt.hash("123456", 10);
    const userData = [
      {
        username: "adrian",
        password: hashedPassword,
        collegeName: "St. Thomas College",
        universityName: "MG University",
        major: "Computer Applications",
      },
    ];

    const userDocs = await User.insertMany(userData);
    const courseData = [
      {
        user: userDocs[0]._id,
        name: "Artificial Intelligence",
        code: "CS501",
        semester: "5th",
      },
    ];

    const courseDocs = await Course.insertMany(courseData);
    const assignmentData = [
      {
        course: courseDocs[0]._id,
        name: "AI Midterm",
        dueDate: new Date(),
        type: "Exam",
        status: "Graded",
        score: 82,
        maxScore: 100,
      },
    ];

    await Assignment.insertMany(assignmentData);

    console.log("\n✨ Database seeding complete! ✨");
  } catch (err) {
    console.error("🛑 Database connection or seeding failed:", err.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Disconnected from MongoDB");
  }
};

seedDatabase();

// =======================================================
// --- Exports ---
// =======================================================
export {
  User,
  Course,
  Assignment,
  ChatRoom,
  Message,
  Event,
  PerformanceAnalysis,
};
