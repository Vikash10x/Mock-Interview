import { Router } from "express";
import Interview from "../models/Interview.js";
import { generateQuestion, evaluateAnswer, summarizeInterview, generateHint } from "../services/ai.js";

const router = Router();

// Start: naya interview + pehla sawaal
router.post("/start", async (req, res, next) => {
  try {
    const {
      role,
      difficulty = "medium",
      language = "English",
      totalQuestions = 5,
      isTimed = false,
      resume = "",
      jobDescription = "",
    } = req.body;
    if (!role) return res.status(400).json({ error: "role is required" });

    const userId = req.headers["x-user-id"] || req.body.userId || "anonymous";

    const question = await generateQuestion({
      role,
      difficulty,
      language,
      resume,
      jobDescription,
      turns: [],
    });
    const interview = await Interview.create({
      userId,
      role,
      difficulty,
      language,
      isTimed: Boolean(isTimed),
      resume,
      jobDescription,
      totalQuestions: Math.min(Math.max(Number(totalQuestions), 1), 10),
      turns: [{ question }],
    });
    res.json({ id: interview._id, question, index: 0, total: interview.totalQuestions });
  } catch (e) {
    next(e);
  }
});

// Answer: evaluate + agla sawaal (ya summary agar interview khatam)
router.post("/:id/answer", async (req, res, next) => {
  try {
    const { answer } = req.body;
    if (!answer?.trim()) return res.status(400).json({ error: "answer is required" });

    const interview = await Interview.findById(req.params.id);
    if (!interview) return res.status(404).json({ error: "Interview not found" });
    if (interview.status === "done") return res.status(400).json({ error: "Interview already finished" });

    const current = interview.turns[interview.turns.length - 1];
    current.answer = answer.trim();
    current.evaluation = await evaluateAnswer({
      role: interview.role,
      difficulty: interview.difficulty,
      language: interview.language,
      resume: interview.resume,
      jobDescription: interview.jobDescription,
      question: current.question,
      answer: current.answer,
    });

    const finished = interview.turns.length >= interview.totalQuestions;
    let nextQuestion = null;

    if (finished) {
      interview.status = "done";
      interview.summary = await summarizeInterview(interview);
    } else {
      nextQuestion = await generateQuestion({
        role: interview.role,
        difficulty: interview.difficulty,
        language: interview.language,
        resume: interview.resume,
        jobDescription: interview.jobDescription,
        turns: interview.turns,
      });
      interview.turns.push({ question: nextQuestion });
    }

    await interview.save();
    res.json({
      evaluation: current.evaluation,
      nextQuestion,
      index: interview.turns.length - 1,
      done: finished,
    });
  } catch (e) {
    next(e);
  }
});

// Hint: candidate ko guidance hint dena
router.post("/:id/hint", async (req, res, next) => {
  try {
    const interview = await Interview.findById(req.params.id);
    if (!interview) return res.status(404).json({ error: "Interview not found" });
    const current = interview.turns[interview.turns.length - 1];
    const hint = await generateHint({
      role: interview.role,
      language: interview.language,
      question: current.question,
    });
    res.json({ hint });
  } catch (e) {
    next(e);
  }
});

// History list - user-specific private history
router.get("/", async (req, res, next) => {
  try {
    const userId = req.headers["x-user-id"] || req.query.userId;
    // Only return interviews matching this specific user
    const filter = userId ? { userId } : { _id: null };

    const list = await Interview.find(filter, "role difficulty status summary.overallScore createdAt")
      .sort({ createdAt: -1 })
      .limit(30);
    res.json(list);
  } catch (e) {
    next(e);
  }
});

// Single interview (report page ke liye)
router.get("/:id", async (req, res, next) => {
  try {
    const interview = await Interview.findById(req.params.id);
    if (!interview) return res.status(404).json({ error: "Not found" });
    res.json(interview);
  } catch (e) {
    next(e);
  }
});

export default router;
