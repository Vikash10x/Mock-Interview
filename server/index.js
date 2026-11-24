import "dotenv/config";
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import interviewRoutes from "./routes/interview.js";
import Visitor from "./models/Visitor.js";

const app = express();
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow all origins (localhost, all Vercel preview/production deployments, etc.)
      callback(null, true);
    },
    credentials: true,
  })
);
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (_req, res) => res.json({ ok: true }));

// Live unique visitor counter
app.get("/api/visitor", async (req, res) => {
  try {
    const isNew = req.query.new === "1";
    let doc;
    if (isNew) {
      doc = await Visitor.findOneAndUpdate(
        { key: "site_visits" },
        { $inc: { count: 1 } },
        { new: true, upsert: true }
      );
    } else {
      doc = await Visitor.findOne({ key: "site_visits" });
      if (!doc) {
        doc = await Visitor.create({ key: "site_visits", count: 1 });
      }
    }
    res.json({ count: doc.count });
  } catch (err) {
    console.error("Visitor counter error:", err);
    res.json({ count: 1 });
  }
});

app.use("/api/interview", interviewRoutes);

// central error handler
app.use((err, _req, res, _next) => {
  console.error(err);
  let message = err.message || "Something went wrong";
  if (
    message.includes("429") ||
    message.includes("RESOURCE_EXHAUSTED") ||
    message.includes("quota")
  ) {
    message =
      "Google Gemini Free Tier daily quota exceeded. All fallback models are exhausted. Please wait for the daily quota reset or try another API key.";
  }
  res.status(500).json({ error: message });
});

const PORT = process.env.PORT || 5000;

if (!process.env.MONGODB_URI) {
  console.error("Error: MONGODB_URI is not defined in server/.env");
  process.exit(1);
}

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => app.listen(PORT, () => console.log(`Server running on :${PORT}`)))
  .catch((e) => {
    console.error("MongoDB connection failed:", e.message);
    process.exit(1);
  });
