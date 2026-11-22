"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { getInterview, sendAnswer, getHint } from "../../api";

export default function InterviewRoom() {
  const { id } = useParams();
  const router = useRouter();
  const [question, setQuestion] = useState("");
  const [language, setLanguage] = useState("English");
  const [index, setIndex] = useState(0);
  const [total, setTotal] = useState(5);
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState(null); // {evaluation, nextQuestion, done}
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Voice States
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);
  const [autoRead, setAutoRead] = useState(true);

  // Advanced AI Features States
  const [cameraActive, setCameraActive] = useState(false);
  const [isCodeMode, setIsCodeMode] = useState(false);
  const [hint, setHint] = useState("");
  const [hintLoading, setHintLoading] = useState(false);

  const recognitionRef = useRef(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  // Stop speaking helper
  const stopSpeaking = useCallback(() => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, []);

  // Speak Question using TTS
  const speakQuestion = useCallback((text) => {
    if (typeof window === "undefined" || !window.speechSynthesis || !text) return;
    window.speechSynthesis.cancel();

    // Strip markdown formatting for cleaner speech
    const cleanText = text.replace(/[\*_`#]/g, "");
    const utterance = new SpeechSynthesisUtterance(cleanText);

    utterance.lang = language === "Hindi" ? "hi-IN" : "en-US";
    utterance.rate = 1.0;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  }, [language]);

  // Page reload par bhi interview resume ho
  useEffect(() => {
    getInterview(id)
      .then((iv) => {
        if (iv.status === "done") return router.replace(`/report/${id}`);
        setLanguage(iv.language || "English");
        setTotal(iv.totalQuestions);
        setIndex(iv.turns.length - 1);
        const currentQ = iv.turns[iv.turns.length - 1].question;
        setQuestion(currentQ);
      })
      .catch((e) => setError(e.message));
  }, [id, router]);

  // Read question aloud when it loads
  useEffect(() => {
    if (question && autoRead && !feedback) {
      speakQuestion(question);
    }
    return () => stopSpeaking();
  }, [question, autoRead, feedback, speakQuestion, stopSpeaking]);

  // Setup Speech Recognition (STT)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechSupported(false);
      return;
    }

    const recog = new SpeechRecognition();
    recog.continuous = true;
    recog.interimResults = true;
    recog.lang = language === "Hindi" ? "hi-IN" : "en-IN";

    recog.onresult = (event) => {
      let finalTranscript = "";
      for (let i = 0; i < event.results.length; i++) {
        finalTranscript += event.results[i][0].transcript + " ";
      }
      setAnswer(finalTranscript.trim());
    };

    recog.onerror = (event) => {
      console.warn("Speech recognition error:", event.error);
      setIsListening(false);
    };

    recog.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recog;

    return () => {
      try {
        recog.stop();
      } catch (_) {}
    };
  }, [language]);

  function toggleListening() {
    if (!recognitionRef.current) return;
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      stopSpeaking();
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.warn("Error starting speech recognition:", err);
      }
    }
  }

  // Camera Management
  async function toggleCamera() {
    if (cameraActive) {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      if (videoRef.current) videoRef.current.srcObject = null;
      setCameraActive(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 320, height: 240, facingMode: "user" },
          audio: false,
        });
        streamRef.current = stream;
        setCameraActive(true);
      } catch (err) {
        console.warn("Camera access failed:", err);
        alert("Camera permission denied or camera not found.");
      }
    }
  }

  // Attach stream to video tag whenever cameraActive becomes true
  useEffect(() => {
    if (cameraActive && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [cameraActive]);

  // Clean up camera stream on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Request Hint from AI Coach
  async function requestHint() {
    if (hintLoading || hint) return;
    setHintLoading(true);
    try {
      const data = await getHint(id);
      setHint(data.hint || "Try breaking the problem down into smaller parts.");
    } catch (err) {
      setHint("Focus on the core concept and structure your response step-by-step.");
    } finally {
      setHintLoading(false);
    }
  }

  // Handle Tab key in Code Editor mode
  function handleKeyDown(e) {
    if (isCodeMode && e.key === "Tab") {
      e.preventDefault();
      const start = e.target.selectionStart;
      const end = e.target.selectionEnd;
      const val = e.target.value;
      setAnswer(val.substring(0, start) + "  " + val.substring(end));
      setTimeout(() => {
        e.target.selectionStart = e.target.selectionEnd = start + 2;
      }, 0);
    }
  }

  async function submit() {
    if (!answer.trim()) return;
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
    stopSpeaking();
    setLoading(true);
    setError("");
    try {
      setFeedback(await sendAnswer(id, answer));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  function next() {
    stopSpeaking();
    setHint("");
    if (feedback.done) return router.push(`/report/${id}`);
    setQuestion(feedback.nextQuestion);
    setIndex(feedback.index);
    setAnswer("");
    setFeedback(null);
  }

  const ev = feedback?.evaluation;

  return (
    <>
      <div className="progress" aria-label={`Question ${index + 1} of ${total}`}>
        {Array.from({ length: total }, (_, i) => (
          <span key={i} className={i <= index ? "on" : ""} />
        ))}
      </div>

      {/* Simulated Live Interview Camera Bar */}
      <div className="camera-container">
        {cameraActive ? (
          <video ref={videoRef} autoPlay playsInline muted className="camera-video" />
        ) : (
          <div
            className="camera-video"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#9ca3af",
              fontSize: "1.8rem",
            }}
          >
            👤
          </div>
        )}
        <div className="camera-meta">
          <div className="live-pill">
            <span className="live-dot" />
            {cameraActive ? "Live Video Interview" : "Camera Off"}
          </div>
          <button
            type="button"
            className="speaker-btn"
            style={{ width: "fit-content", padding: "5px 12px" }}
            onClick={toggleCamera}
          >
            {cameraActive ? "📷 Turn Off Camera" : "📹 Enable Webcam Mirror"}
          </button>
        </div>
      </div>

      <section className="panel">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <p className="muted" style={{ margin: 0 }}>Question {index + 1} of {total}</p>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <label className="auto-read-label">
              <input
                type="checkbox"
                checked={autoRead}
                onChange={(e) => setAutoRead(e.target.checked)}
              />
              Auto-read
            </label>
            <button
              className={`speaker-btn ${isSpeaking ? "active" : ""}`}
              onClick={() => (isSpeaking ? stopSpeaking() : speakQuestion(question))}
              title={isSpeaking ? "Stop speaking" : "Listen to question"}
              type="button"
            >
              {isSpeaking ? "⏹️ Stop" : "🔊 Listen"}
            </button>
          </div>
        </div>

        <p className="question">{question || "Loading…"}</p>

        {!feedback && (
          <>
            <div className="voice-bar">
              <div className="mode-tabs">
                <button
                  type="button"
                  className={`mode-tab ${!isCodeMode ? "active" : ""}`}
                  onClick={() => setIsCodeMode(false)}
                >
                  📝 Text Mode
                </button>
                <button
                  type="button"
                  className={`mode-tab ${isCodeMode ? "active" : ""}`}
                  onClick={() => setIsCodeMode(true)}
                >
                  💻 Code Editor
                </button>
              </div>

              {speechSupported && !isCodeMode && (
                <button
                  type="button"
                  className={`mic-btn ${isListening ? "active" : ""}`}
                  onClick={toggleListening}
                  disabled={loading}
                >
                  {isListening ? (
                    <>
                      <span>🔴</span> Listening… (Click to stop)
                    </>
                  ) : (
                    <>
                      <span>🎙️</span> Speak Answer (Mic)
                    </>
                  )}
                </button>
              )}
            </div>

            <textarea
              id="ans"
              className={isCodeMode ? "code-editor" : ""}
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                isCodeMode
                  ? "// Write your code or pseudo-code here...\n// Press Tab to indent with 2 spaces"
                  : isListening
                  ? "Listening to you... Speak into your microphone..."
                  : "Type your answer or click 'Speak Answer' to speak..."
              }
              disabled={loading}
              spellCheck={!isCodeMode}
            />

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap" }}>
              <button className="btn" onClick={submit} disabled={loading || !answer.trim()}>
                {loading ? "Evaluating…" : "Submit answer"}
              </button>

              {!hint && (
                <button
                  type="button"
                  className="hint-btn"
                  onClick={requestHint}
                  disabled={hintLoading || loading}
                >
                  {hintLoading ? "Thinking of a hint…" : "💡 Need a Hint?"}
                </button>
              )}
            </div>

            {hint && (
              <div className="hint-box">
                <span>💡</span>
                <div>
                  <strong>Interview Coach Hint:</strong> {hint}
                </div>
              </div>
            )}
          </>
        )}

        {ev && (
          <div className="feedback">
            <div className="score">{ev.score}/10</div>
            <span className="tag-good">What worked</span>
            <ul>{ev.strengths.map((s, i) => <li key={i}>{s}</li>)}</ul>
            <span className="tag-warn">To improve</span>
            <ul>{ev.improvements.map((s, i) => <li key={i}>{s}</li>)}</ul>
            <div className="ideal"><strong>A stronger answer</strong><br />{ev.idealAnswer}</div>
            <button className="btn" onClick={next}>{feedback.done ? "See my report" : "Next question"}</button>
          </div>
        )}
        {error && <p className="error">{error}</p>}
      </section>
    </>
  );
}
