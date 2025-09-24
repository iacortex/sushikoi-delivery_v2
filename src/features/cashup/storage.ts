const KEY = "cashup.sessions.v1";

export function loadSessions<T = any[]>(): T {
  try { return JSON.parse(localStorage.getItem(KEY) || "[]"); }
  catch { return [] as unknown as T; }
}

export function saveSessions(sessions: any[]) {
  localStorage.setItem(KEY, JSON.stringify(sessions));
}
