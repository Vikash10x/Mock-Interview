const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

async function req(path, options) {
  const res = await fetch(`${BASE}/api/interview${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
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
