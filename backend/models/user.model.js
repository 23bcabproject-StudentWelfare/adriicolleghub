// ===========================================
// ✅ CollegeHub Models - MongoDB + Mongoose Schemas
// ===========================================

import mongoose from "mongoose";

// =======================================================
// --- Mongoose Schemas ---
// =======================================================

// 1️⃣ User Schema - Updated to match actual MongoDB Atlas data
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

// 5️⃣ Assignment Schema
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

// 6️⃣ ChatRoom Schema
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

// 7️⃣ Message Schema
const MessageSchema = new mongoose.Schema(
  {
    chatRoom: { type: mongoose.Schema.Types.ObjectId, ref: "ChatRoom", required: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    content: { type: String, trim: true, required: true },
    messageType: { type: String, enum: ["text", "image", "link"], default: "text" },
  },
  { timestamps: true }
);

// 8️⃣ Event Schema
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

// 9️⃣ Performance Analysis Schema
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