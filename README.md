# AI Mock Interviewer

Next.js client + Express/MongoDB server + Claude API.

## Setup
```bash
# 1. Server
cd server
cp .env.example .env     # ANTHROPIC_API_KEY aur MONGODB_URI daalo
npm install
npm run dev              # http://localhost:5000

# 2. Client (naya terminal)
cd client
cp .env.example .env.local
npm install
npm run dev              # http://localhost:3000
```

## API
| Method | Route | Kaam |
|---|---|---|
| POST | /api/interview/start | role, difficulty, language, totalQuestions -> pehla sawaal |
| POST | /api/interview/:id/answer | answer evaluate + agla sawaal / final summary |
| GET | /api/interview | history |
| GET | /api/interview/:id | poora interview + report |

## Next steps
- Auth (JWT / NextAuth) taaki har user ki apni history ho
- Voice input (Web Speech API ya Whisper)
- Resume upload -> resume based questions
- Progress graph (history se)
