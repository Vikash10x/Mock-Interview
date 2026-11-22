import { GoogleGenAI } from "@google/genai";
import Anthropic from "@anthropic-ai/sdk";

// Safe JSON parser to strip markdown fences
function parseJson(text) {
  const clean = text.replace(/```json|```/g, "").trim();
  const start = clean.indexOf("{");
  const end = clean.lastIndexOf("}");
  if (start === -1 || end === -1) {
    throw new Error(`Failed to parse AI response as JSON: ${text}`);
  }
  return JSON.parse(clean.slice(start, end + 1));
}

function getAiClient() {
  const geminiKey =
    process.env.GEMINI_API_KEY?.trim() ||
    (process.env.ANTHROPIC_API_KEY?.trim().startsWith("AQ.") ||
    process.env.ANTHROPIC_API_KEY?.trim().startsWith("AIza")
      ? process.env.ANTHROPIC_API_KEY.trim()
      : null);

  const anthropicKey = process.env.ANTHROPIC_API_KEY?.trim();

  // If Gemini key is detected
  if (geminiKey && geminiKey !== "your_key_here") {
    const ai = new GoogleGenAI({ apiKey: geminiKey });
    const candidateModels = [
      ...new Set(
        [
          process.env.GEMINI_MODEL,
          "gemini-3.5-flash-lite",
          "gemini-3.1-flash-lite",
          "gemini-3.5-flash",
        ].filter(Boolean)
      ),
    ];

    return {
      type: "gemini",
      async ask(system, user, max_tokens = 2048, isJson = false) {
        const config = {
          systemInstruction: system,
          maxOutputTokens: max_tokens,
        };
        if (isJson) {
          config.responseMimeType = "application/json";
        }

        let lastError = null;
        for (const model of candidateModels) {
          try {
            const res = await ai.models.generateContent({
              model,
              config,
              contents: user,
            });
            return res.text?.trim() || "";
          } catch (err) {
            console.warn(`Model ${model} failed:`, err.status || err.message);
            lastError = err;
            const isRetryable =
              err.status === 429 ||
              err.status === 503 ||
              err.status === 404 ||
              err.message?.includes("RESOURCE_EXHAUSTED") ||
              err.message?.includes("quota") ||
              err.message?.includes("demand");

            if (!isRetryable) {
              throw err;
            }
          }
        }
        throw lastError;
      },
    };
  }

  // If Anthropic Claude key is provided
  if (anthropicKey && anthropicKey !== "your_key_here") {
    const client = new Anthropic({ apiKey: anthropicKey });
    const model = process.env.ANTHROPIC_MODEL || "claude-3-5-sonnet-20241022";
    return {
      type: "anthropic",
      async ask(system, user, max_tokens = 2048) {
        const res = await client.messages.create({
          model,
          max_tokens,
          system,
          messages: [{ role: "user", content: user }],
        });
        return res.content
          .filter((b) => b.type === "text")
          .map((b) => b.text)
          .join("")
          .trim();
      },
    };
  }

  throw new Error(
    "Missing API Key. Please set a valid GEMINI_API_KEY or ANTHROPIC_API_KEY in server/.env"
  );
}

async function ask(system, user, max_tokens = 2048, isJson = false) {
  const client = getAiClient();
  return client.ask(system, user, max_tokens, isJson);
}

const transcript = (turns) =>
  turns.map((t, i) => `Q${i + 1}: ${t.question}\nA${i + 1}: ${t.answer ?? "(not answered)"}`).join("\n\n");

export async function generateQuestion({ role, difficulty, language, resume = "", jobDescription = "", turns = [] }) {
  let contextInfo = "";
  if (resume?.trim()) {
    contextInfo += `\nCandidate Resume/Experience:\n${resume.trim().slice(0, 1500)}\n`;
  }
  if (jobDescription?.trim()) {
    contextInfo += `\nTarget Job Description (JD):\n${jobDescription.trim().slice(0, 1500)}\n`;
  }

  const system = `You are an expert interviewer for a ${role} position. Difficulty: ${difficulty}.
${contextInfo ? `${contextInfo}\nTailor your questions to test the candidate against their claimed resume projects and the requirements in the Job Description.` : ""}
Ask exactly ONE clear interview question at a time. Do not repeat earlier topics.
If the candidate's last answer was weak or interesting, you may ask a follow-up on it.
Language: ${language}. Return ONLY the question text, no numbering, no preamble.`;

  const user = turns.length
    ? `Interview so far:\n${transcript(turns)}\n\nAsk the next question.`
    : "Ask the first question.";
  return (await ask(system, user, 600, false)).trim();
}

export async function evaluateAnswer({ role, difficulty, language, resume = "", jobDescription = "", question, answer }) {
  let extraContext = "";
  if (jobDescription?.trim()) {
    extraContext += `Consider the expectations of this Job Description:\n${jobDescription.trim().slice(0, 800)}\n`;
  }

  const system = `You are a strict but constructive ${role} interviewer (${difficulty} level).
${extraContext}
Evaluate the candidate's answer. Write feedback in ${language}.
Return ONLY a valid JSON object in this exact shape:
{"score": <integer 0-10>, "strengths": [string], "improvements": [string], "idealAnswer": string}`;
  const raw = await ask(system, `Question: ${question}\nAnswer: ${answer}`, 2048, true);
  return parseJson(raw);
}

export async function generateHint({ role, language, question }) {
  const system = `You are an interview coach for a ${role} position.
Provide a concise, helpful 1-2 sentence hint or guiding angle for the candidate on how to approach this question without giving away the full answer directly.
Language: ${language}. Return ONLY the hint text.`;
  return (await ask(system, `Question: ${question}\nPlease give a hint.`, 300, false)).trim();
}

export async function summarizeInterview(interview) {
  const { role, language, turns, resume = "", jobDescription = "" } = interview;
  let customContext = "";
  if (jobDescription?.trim()) {
    customContext += `Target Job Description:\n${jobDescription.trim().slice(0, 800)}\n`;
  }
  if (resume?.trim()) {
    customContext += `Candidate Resume Background:\n${resume.trim().slice(0, 800)}\n`;
  }

  const system = `You are a senior hiring manager reviewing a mock ${role} interview.
${customContext}
Write in ${language}. In the verdict, mention whether this candidate is ready for this role/JD based on their performance.
Return ONLY a valid JSON object:
{"overallScore": <integer 0-100>, "verdict": string (2 sentences), "strengths": [string], "weaknesses": [string], "nextSteps": [string]}`;
  const scores = turns.map((t, i) => `Q${i + 1} score: ${t.evaluation?.score ?? 0}/10`).join("\n");
  const raw = await ask(system, `${transcript(turns)}\n\n${scores}`, 3000, true);
  return parseJson(raw);
}
