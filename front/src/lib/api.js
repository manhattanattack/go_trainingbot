import { SAMPLE_HISTORY } from "./sampleData.js"

// API layer for the Go backend (proxied to :8080 via vite.config.js).
//
// NOTE: When the backend is unreachable (e.g. previewing without the Go
// server running), we fall back to sample data so the UI is still usable.
// In your real environment the proxy hits the live backend and this
// fallback never triggers.

export async function fetchHistory() {
  try {
    const res = await fetch("/me", { headers: { Accept: "application/json" } })
    if (!res.ok) throw new Error(`Failed to load history (${res.status})`)
    const data = await res.json()
    return Array.isArray(data) ? data : []
  } catch (err) {
    if (import.meta.env.DEV) {
      console.warn("[Kore] /me unreachable, using sample data:", err.message)
      return SAMPLE_HISTORY
    }
    throw err
  }
}

export async function saveTraining(payload) {
  const res = await fetch("/api/training", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(`Failed to save workout (${res.status})`)
  // Backend may return the created object or nothing; tolerate both.
  const text = await res.text()
  return text ? JSON.parse(text) : null
}
