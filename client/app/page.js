"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { startInterview, getHistory } from "./api";

const ROLES = ["Frontend Developer", "Backend Developer", "Full Stack Developer", "DSA / Problem Solving", "Data Analyst", "HR Round"];
const LEVELS = ["easy", "medium", "hard"];
const LANGS = ["English", "Hinglish", "Hindi"];

export default function Setup() {
  const router = useRouter();
  const [role, setRole] = useState(ROLES[0]);
  const [difficulty, setDifficulty] = useState("medium");
  const [language, setLanguage] = useState("English");
  const [totalQuestions, setTotal] = useState(5);
  const [resume, setResume] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [history, setHistory] = useState([]);

  useEffect(() => {
    getHistory().then(setHistory).catch(() => {});
  }, []);

  async function begin() {
    setLoading(true);
    setError("");
    try {
      const data = await startInterview({
        role,
        difficulty,
        language,
        totalQuestions,
        resume,
        jobDescription,
      });
      router.push(`/interview/${data.id}`);
    } catch (e) {
      setError(e.message);
      setLoading(false);
    }
  }

  return (
    <>
      <h1>Practice the interview before it counts.</h1>
      <p className="lead">Pick a role. You get one question at a time, a score on every answer, and a full report at the end.</p>

      <section className="panel">
        <label>Role</label>
        <div className="chips">
          {ROLES.map((r) => (
            <button key={r} className="chip" aria-pressed={role === r} onClick={() => setRole(r)}>{r}</button>
          ))}
        </div>

        <label>Difficulty</label>
        <div className="chips">
          {LEVELS.map((l) => (
            <button key={l} className="chip" aria-pressed={difficulty === l} onClick={() => setDifficulty(l)}>{l}</button>
          ))}
        </div>

        <label>Language</label>
        <div className="chips">
          {LANGS.map((l) => (
            <button key={l} className="chip" aria-pressed={language === l} onClick={() => setLanguage(l)}>{l}</button>
          ))}
        </div>

        <label htmlFor="count">Number of questions: {totalQuestions}</label>
        <input id="count" type="range" min="3" max="10" value={totalQuestions} onChange={(e) => setTotal(+e.target.value)} />

        <div style={{ marginTop: 22, borderTop: "1px dashed var(--line)", paddingTop: 16 }}>
          <button
            type="button"
            className="chip"
            style={{ fontWeight: 600, fontSize: "0.88rem", display: "inline-flex", alignItems: "center", gap: 6 }}
            onClick={() => setShowAdvanced(!showAdvanced)}
          >
            <span>{showAdvanced ? "▼" : "▶"}</span>
            <span>📄 Tailor with Resume & Job Description (Optional)</span>
          </button>

          {showAdvanced && (
            <div style={{ marginTop: 14 }}>
              <label htmlFor="resume" style={{ marginTop: 8 }}>Your Resume / Key Projects</label>
              <textarea
                id="resume"
                style={{ minHeight: 90 }}
                value={resume}
                onChange={(e) => setResume(e.target.value)}
                placeholder="Paste key projects, skills, and experience from your resume. AI will grill you on what you claim here!"
              />

              <label htmlFor="jd" style={{ marginTop: 12 }}>Target Job Description (JD)</label>
              <textarea
                id="jd"
                style={{ minHeight: 90 }}
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste the company's job description or requirements. AI will verify if you match what they are looking for."
              />
            </div>
          )}
        </div>

        <button className="btn" onClick={begin} disabled={loading}>
          {loading ? "Preparing your first question…" : "Start interview"}
        </button>
        {error && <p className="error">{error}</p>}
      </section>

      {history.length > 0 && (
        <section className="history" style={{ marginTop: 44 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, flexWrap: "wrap", gap: 10 }}>
            <h2 style={{ margin: 0 }}>🔒 Your Private History & Analytics</h2>
            <button
              type="button"
              className="speaker-btn"
              style={{ fontSize: "0.8rem" }}
              onClick={() => {
                if (window.confirm("Are you sure you want to clear your local interview history on this device?")) {
                  localStorage.removeItem("mock_user_id");
                  setHistory([]);
                }
              }}
            >
              🗑️ Clear My History
            </button>
          </div>

          {/* Quick Metrics Cards */}
          <div className="analytics-grid">
            <div className="metric-card">
              <span className="metric-val">{history.length}</span>
              <span className="metric-label">Total Sessions</span>
            </div>
            <div className="metric-card">
              <span className="metric-val">
                {history.filter((h) => h.status === "done").length}
              </span>
              <span className="metric-label">Completed</span>
            </div>
            <div className="metric-card">
              <span className="metric-val">
                {(() => {
                  const scored = history.filter(
                    (h) => h.status === "done" && typeof h.summary?.overallScore === "number"
                  );
                  if (!scored.length) return "-";
                  const avg = Math.round(
                    scored.reduce((acc, h) => acc + h.summary.overallScore, 0) / scored.length
                  );
                  return `${avg}%`;
                })()}
              </span>
              <span className="metric-label">Avg. Score</span>
            </div>
            <div className="metric-card">
              <span className="metric-val" style={{ color: "var(--good)" }}>
                {(() => {
                  const scored = history.filter(
                    (h) => h.status === "done" && typeof h.summary?.overallScore === "number"
                  );
                  if (!scored.length) return "-";
                  return `${Math.max(...scored.map((h) => h.summary.overallScore))}%`;
                })()}
              </span>
              <span className="metric-label">Peak Score</span>
            </div>
          </div>

          {/* Recent Score Trend Visualization */}
          {(() => {
            const scoredChronological = history
              .filter((h) => h.status === "done" && typeof h.summary?.overallScore === "number")
              .slice()
              .reverse()
              .slice(-8);

            if (scoredChronological.length >= 2) {
              return (
                <div className="sparkline-container">
                  <div className="sparkline-header">
                    <span>Score Progression (Recent Interviews)</span>
                    <span>Out of 100</span>
                  </div>
                  <div className="sparkline-bars">
                    {scoredChronological.map((item, idx) => {
                      const sc = item.summary.overallScore;
                      let barColor = "var(--accent)";
                      if (sc >= 80) barColor = "var(--good)";
                      else if (sc < 50) barColor = "var(--warn)";

                      return (
                        <div className="sparkline-col" key={item._id || idx}>
                          <div
                            className="sparkline-bar"
                            style={{
                              height: `${Math.max(sc, 10)}%`,
                              background: barColor,
                            }}
                            title={`${item.role}: ${sc}/100`}
                          />
                          <span className="sparkline-label">{sc}%</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            }
            return null;
          })()}

          <h3 style={{ fontSize: "1.05rem", margin: "20px 0 10px", color: "var(--muted)" }}>
            Past Interview Transcripts
          </h3>
          {history.map((h) => (
            <Link key={h._id} href={h.status === "done" ? `/report/${h._id}` : `/interview/${h._id}`}>
              <span>
                {h.role} <span className="muted">({h.difficulty})</span>
              </span>
              <span className="muted" style={{ fontWeight: 600 }}>
                {h.status === "done" ? (
                  <span style={{ color: (h.summary?.overallScore ?? 0) >= 70 ? "var(--good)" : "inherit" }}>
                    {h.summary?.overallScore ?? "-"}/100
                  </span>
                ) : (
                  "In Progress"
                )}
              </span>
            </Link>
          ))}
        </section>
      )}
    </>
  );
}
