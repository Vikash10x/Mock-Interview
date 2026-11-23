import mongoose from "mongoose";

const turnSchema = new mongoose.Schema(
  {
    question: String,
    answer: String,
    evaluation: {
      score: Number,
      strengths: [String],
      improvements: [String],
      idealAnswer: String,
    },
  },
  { _id: false }
);

const interviewSchema = new mongoose.Schema(
  {
    userId: { type: String, default: "anonymous", index: true },
    role: { type: String, required: true },
    difficulty: { type: String, default: "medium" },
    language: { type: String, default: "English" },
    totalQuestions: { type: Number, default: 5 },
    resume: { type: String, default: "" },
    jobDescription: { type: String, default: "" },
    turns: [turnSchema],
    status: { type: String, enum: ["active", "done"], default: "active" },
    summary: {
      overallScore: Number,
      verdict: String,
      strengths: [String],
      weaknesses: [String],
      nextSteps: [String],
    },
  },
  { timestamps: true }
);

export default mongoose.model("Interview", interviewSchema);
