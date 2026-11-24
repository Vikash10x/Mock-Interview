const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

// Har user ka apna private unique identifier generate karna
export function getUserId() {
  if (typeof window === "undefined") return "anon";
  let uid = localStorage.getItem("mock_user_id");
  if (!uid) {
    uid = "usr_" + Math.random().toString(36).substring(2, 11) + "_" + Date.now();
    localStorage.setItem("mock_user_id", uid);
  }
  return uid;
}

async function req(path, options = {}) {
  const userId = getUserId();
  const res = await fetch(`${BASE}/api/interview${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "x-user-id": userId,
      ...(options.headers || {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed with status ${res.status}`);
  return data;
}

export const startInterview = (body) => req("/start", { method: "POST", body: JSON.stringify(body) });
export const sendAnswer = (id, answer) => req(`/${id}/answer`, { method: "POST", body: JSON.stringify({ answer }) });
export const getHint = (id) => req(`/${id}/hint`, { method: "POST" });
export const getInterview = (id) => req(`/${id}`);
export const getHistory = () => req("");

export async function getVisitorCount() {
  const isNew = typeof window !== "undefined" && !sessionStorage.getItem("mock_visited") ? "1" : "0";
  if (typeof window !== "undefined") sessionStorage.setItem("mock_visited", "true");
  try {
    const res = await fetch(`${BASE}/api/visitor?new=${isNew}`);
    const data = await res.json().catch(() => ({}));
    return data.count || null;
  } catch (_) {
    return null;
  }
}
