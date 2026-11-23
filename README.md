# 🎯 AI Mock Interviewer — Full-Stack AI Interview Platform

An intelligent, multi-turn AI Mock Interview platform designed to help candidates prepare for technical and behavioral interviews with real-time voice speech, video simulation, instant rubric scoring, model answers, and comprehensive performance analytics.

---

## 🚀 Key Features

- **🎙️ Voice Recognition (Speech-to-Text & Text-to-Speech):**
  - AI speaks interview questions aloud with clear voice modulation.
  - Candidates answer questions by speaking directly into the microphone via the Web Speech API.
- **📹 Simulated Live Webcam Mirror:**
  - Integrated picture-in-picture video feed mimicking real Zoom / Google Meet interview settings to build camera confidence.
- **📄 Resume & Job Description (JD) Tailoring:**
  - Candidates can paste project details or job descriptions; the AI asks contextual follow-up questions challenging claimed skills and projects.
- **💻 Interactive Code Editor Mode:**
  - Monospace code workspace with 2-space Tab key indentation support for coding and DSA rounds.
- **💡 AI Coach Hints:**
  - On-demand guiding hints to assist candidates when stuck without giving away the complete solution.
- **🌐 Multilingual Support:**
  - Full interview experience available in **English**, **Hinglish**, and **Hindi**.
- **📊 Comprehensive Scoring & Performance Analytics:**
  - Real-time scoring (0–10) with granular breakdowns of Strengths, Weaknesses, and Ideal Answers.
  - Final report card (0–100) with hiring verdicts, candidate tier badges, and downloadable/printable PDF scorecards (`@media print`).
  - Interactive homepage analytics dashboard with historical score progression sparklines.
- **⚡ Resilient AI Pipeline:**
  - Built-in automated multi-model fallback (`gemini-3.5-flash`, `gemini-3.5-flash-lite`, `gemini-3.1-flash-lite`, and Anthropic Claude compatibility).

---

## 🛠️ Tech Stack

- **Frontend:** Next.js (App Router), React, Vanilla CSS, Web Speech API, MediaDevices API
- **Backend:** Node.js, Express.js, Mongoose ODM, CORS, Dotenv
- **AI Engine:** Google Gemini SDK (`@google/genai`) with automated model fallback
- **Database:** MongoDB Atlas (Cloud)
- **Deployment:** Vercel (Client) + Render (Server)

---

## 📁 Project Structure

```
ai-mock-interviewer/
├── client/                  # Next.js Frontend Application
│   ├── app/
│   │   ├── interview/[id]/  # Live interview room (Voice, Video, Code Editor)
│   │   ├── report/[id]/     # Detailed scorecard & PDF export
│   │   ├── api.js           # API client layer
│   │   ├── globals.css      # Custom styling & print profiles
│   │   └── page.js          # Homepage setup & analytics dashboard
│   ├── .env.example
│   └── package.json
├── server/                  # Express REST API Backend
│   ├── models/              # Mongoose schemas (Interview)
│   ├── routes/              # Express API endpoints
│   ├── services/            # AI service (Gemini / Anthropic)
│   ├── index.js             # Server entry point & CORS configuration
│   ├── .env.example
│   └── package.json
└── README.md
```

---

## ⚙️ Local Development Setup

### 1. Clone the repository
```bash
git clone https://github.com/Vikash10x/Mock-Interview.git
cd Mock-Interview
```

### 2. Configure Backend
```bash
cd server
npm install
```
Create a `.env` file inside `server/` with:
```env
GEMINI_API_KEY=your_gemini_api_key
MONGODB_URI=your_mongodb_connection_string
CLIENT_URL=http://localhost:3000,http://localhost:3001
PORT=5000
```
Start the backend:
```bash
node index.js
```

### 3. Configure Frontend
Open a new terminal:
```bash
cd client
npm install
```
Create a `.env.local` file inside `client/`:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```
Start the frontend:
```bash
npm run dev
```
Visit `http://localhost:3001` in your browser!

---

## 📡 API Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/interview/start` | Creates interview session, parses resume/JD, and returns question 1 |
| `POST` | `/api/interview/:id/answer` | Evaluates answer, provides 0-10 score, and generates follow-up question |
| `POST` | `/api/interview/:id/hint` | Generates a strategic guiding hint for the active question |
| `GET` | `/api/interview` | Returns past interview sessions for analytics tracking |
| `GET` | `/api/interview/:id` | Returns full interview transcript, scores, and summary for reporting |

---

## 📄 License
MIT License. Open source and free to use for candidate interview preparation.
