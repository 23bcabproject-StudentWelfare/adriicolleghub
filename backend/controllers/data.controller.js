// ===========================================
// ✅ CollegeHub Controllers - Fixed Endpoints
// ===========================================

import {
  User,
  Course,
  Assignment,
  ChatRoom,
  Message,
  Event,
  PerformanceAnalysis,
} from "../models/user.model.js";

/**
 * @function getUsers
 * @description Fetches all users (basic info only).
 * @route GET /api/data/users
 */
export const getUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password");
    if (users.length === 0) {
      return res.status(404).json({ message: "No users found." });
    }
    res.status(200).json(users);
  } catch (error) {
    console.error("Error fetching users:", error.message);
    res.status(500).json({
      message: "Server error while fetching user data.",
      error: error.message,
    });
  }
};

/**
 * @function getUserById
 * @description Fetches a single user by MongoDB ObjectId.
 * @route GET /api/data/users/:id
 */
export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found." });
    res.status(200).json(user);
  } catch (error) {
    if (error.name === "CastError")
      return res.status(400).json({ message: "Invalid user ID format." });
    console.error("Error fetching user:", error.message);
    res.status(500).json({
      message: "Server error while fetching user data.",
      error: error.message,
    });
  }
};

/**
 * @function getUserFullContext
 * @description Fetches a user's complete academic + activity context:
 * Courses, Assignments, ChatRooms, Events, and Performance Analysis.
 * @route GET /api/data/context/:id
 */
export const getUserFullContext = async (req, res) => {
  try {
    const userId = req.params.id;

    // 1️⃣ Fetch user
    const user = await User.findById(userId).select("-password");
    if (!user) return res.status(404).json({ message: "User not found." });

    // Convert to plain object for augmentation
    const context = user.toObject();

    // 2️⃣ Fetch related collections in parallel
    const [courses, assignments, chatRooms, events, performanceReports] =
      await Promise.all([
        Course.find({ user: userId }),
        Assignment.find()
          .populate({
            path: "course",
            match: { user: userId },
            select: "name code semester",
          })
          .lean(),
        ChatRoom.find({ participants: userId })
          .populate("participants", "username collegeName")
          .populate("lastMessage")
          .lean(),
        Event.find({ user: userId }).lean(),
        PerformanceAnalysis.find({ user: userId }).lean(),
      ]);

    // 3️⃣ Organize data
    const courseMap = new Map(courses.map((c) => [c._id.toString(), c]));

    const assignmentsByCourse = {};
    for (const a of assignments) {
      if (a.course && courseMap.has(a.course._id.toString())) {
        const cid = a.course._id.toString();
        if (!assignmentsByCourse[cid]) assignmentsByCourse[cid] = [];
        assignmentsByCourse[cid].push(a);
      }
    }

    // 4️⃣ Final context structure
    context.academics = courses.map((course) => ({
      ...course.toObject(),
      assignments: assignmentsByCourse[course._id.toString()] || [],
    }));

    context.chatRooms = chatRooms;
    context.events = events;
    context.performanceReports = performanceReports;

    // 5️⃣ Respond
    res.status(200).json(context);
  } catch (error) {
    if (error.name === "CastError")
      return res.status(400).json({ message: "Invalid user ID format." });
    console.error("Error fetching full context:", error.message);
    res.status(500).json({
      message: "Server error while fetching user context.",
      error: error.message,
    });
  }
};
