"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { getInterview } from "../../api";

export default function Report() {
  const { id } = useParams();
  const [iv, setIv] = useState(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [expandedTurns, setExpandedTurns] = useState({});

  useEffect(() => {
    getInterview(id).then(setIv).catch((e) => setError(e.message));
  }, [id]);

  if (error) return <p className="error">{error}</p>;
  if (!iv) return <p className="muted">Loading interview assessment report…</p>;

  const s = iv.summary;
  const score = s?.overallScore ?? 0;

  let gradeClass = "d";
  let gradeText = "Needs Practice";
  if (score >= 85) {
    gradeClass = "a";
    gradeText = "🌟 Strong Hire";
  } else if (score >= 70) {
    gradeClass = "b";
    gradeText = "✅ Recommended";
  } else if (score >= 50) {
    gradeClass = "c";
    gradeText = "⚠️ Developing";
  }

  function handlePrint() {
    window.print();
  }

  async function copySummary() {
    const text = `🎯 AI Mock Interview Performance Report\n` +
      `Role: ${iv.role} (${iv.difficulty} level)\n` +
      `Overall Score: ${score}/100 [${gradeText}]\n\n` +
      `Verdict: ${s?.verdict || "Completed"}\n\n` +
      `Top Strengths:\n${s?.strengths?.map((x) => `• ${x}`).join("\n") || "N/A"}\n\n` +
      `Areas to Practice:\n${s?.weaknesses?.map((x) => `• ${x}`).join("\n") || "N/A"}`;

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (_) {}
  }

  function toggleTurn(i) {
    setExpandedTurns((prev) => ({ ...prev, [i]: !prev[i] }));
  }

  const dateFormatted = iv.createdAt
    ? new Date(iv.createdAt).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "Recent";

  return (
    <div className="report">
      {/* Print-only official header */}
      <div className="print-only">
        <h1>AI Mock Interview Evaluation Report</h1>
        <p className="muted" style={{ margin: 0 }}>
          Candidate Assessment | Role: {iv.role} ({iv.difficulty}) | Date: {dateFormatted}
        </p>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
        <div>
          <p className="muted" style={{ margin: 0 }}>
            {iv.role} &bull; {iv.difficulty.toUpperCase()} &bull; {dateFormatted}
          </p>
          <div style={{ display: "flex", alignItems: "center", marginTop: 4 }}>
            <span className="big-score">{s?.overallScore ?? "-"}</span>
            <span className="muted" style={{ fontSize: "1.6rem", fontWeight: 700, marginLeft: 4 }}>
              /100
            </span>
            <span className={`grade-badge ${gradeClass}`}>{gradeText}</span>
          </div>
        </div>

        {/* Action Toolbar */}
        <div className="report-actions no-print" style={{ margin: 0 }}>
          <button className="btn ghost" style={{ marginTop: 0 }} onClick={handlePrint} type="button">
            📥 Download / Print PDF
          </button>
          <button className="btn ghost" style={{ marginTop: 0 }} onClick={copySummary} type="button">
            {copied ? "✓ Copied to Clipboard!" : "📋 Copy Shareable Summary"}
          </button>
        </div>
      </div>

      <p className="lead" style={{ marginTop: 16 }}>{s?.verdict}</p>

      {/* Strengths & Weaknesses Panel */}
      <section className="panel">
        <span className="tag-good">Key Strengths</span>
        <ul>
          {s?.strengths?.map((x, i) => (
            <li key={i}>{x}</li>
          ))}
        </ul>

        <span className="tag-warn" style={{ marginTop: 12, display: "inline-block" }}>
          Areas for Improvement
        </span>
        <ul>
          {s?.weaknesses?.map((x, i) => (
            <li key={i}>{x}</li>
          ))}
        </ul>

        {s?.nextSteps?.length > 0 && (
          <>
            <strong style={{ display: "inline-block", marginTop: 12 }}>
              Action Plan: What to practice next
            </strong>
            <ul>
              {s.nextSteps.map((x, i) => (
                <li key={i}>{x}</li>
              ))}
            </ul>
          </>
        )}
      </section>

      {/* Question by question section */}
      <h2 style={{ marginTop: 36 }}>Question-by-Question Breakdown</h2>
      {iv.turns.map((t, i) => {
        const isExp = !!expandedTurns[i];
        const turnScore = t.evaluation?.score ?? 0;
        let scoreColor = "var(--good)";
        if (turnScore < 5) scoreColor = "var(--warn)";

        return (
          <div className="turn" key={i}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
              <strong>
                {i + 1}. {t.question}
              </strong>
              <span
                style={{
                  fontWeight: 800,
                  fontSize: "1.1rem",
                  color: scoreColor,
                  whiteSpace: "nowrap",
                }}
              >
                {turnScore}/10
              </span>
            </div>

            <p style={{ margin: "8px 0", background: "#f8fafc", padding: "10px 12px", borderRadius: 8 }}>
              <span className="muted" style={{ fontWeight: 600 }}>Your Answer: </span>
              {t.answer || "(No answer given)"}
            </p>

            {t.evaluation?.strengths?.length > 0 && (
              <p style={{ margin: "4px 0", fontSize: "0.92rem" }}>
                <span className="tag-good">Worked well: </span>
                {t.evaluation.strengths.join(", ")}
              </p>
            )}

            {t.evaluation?.improvements?.length > 0 && (
              <p style={{ margin: "4px 0", fontSize: "0.92rem" }}>
                <span className="tag-warn">To improve: </span>
                {t.evaluation.improvements.join(", ")}
              </p>
            )}

            {t.evaluation?.idealAnswer && (
              <div style={{ marginTop: 8 }}>
                <button
                  type="button"
                  className="speaker-btn no-print"
                  onClick={() => toggleTurn(i)}
                  style={{ fontSize: "0.8rem", padding: "3px 8px" }}
                >
                  {isExp ? "▲ Hide Ideal Answer" : "💡 View Ideal Answer"}
                </button>
                {isExp && (
                  <div className="ideal" style={{ marginTop: 8 }}>
                    <strong>Ideal Model Answer:</strong>
                    <br />
                    {t.evaluation.idealAnswer}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}

      <div className="no-print" style={{ marginTop: 32 }}>
        <Link href="/">
          <button className="btn ghost">Start Another Interview</button>
        </Link>
      </div>
    </div>
  );
}
