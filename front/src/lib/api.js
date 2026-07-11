import { SAMPLE_HISTORY } from "./sampleData.js"
import WebApp from "@twa-dev/sdk";
// API layer for the Go backend (proxied to :8080 via vite.config.js).
//
// NOTE: When the backend is unreachable (e.g. previewing without the Go
// server running), we fall back to sample data so the UI is still usable.
// In your real environment the proxy hits the live backend and this
// fallback never triggers.

WebApp.ready()
const initData = WebApp.initData;

export async function fetchHistory() {
  try {
    const res = await fetch("/me", { headers: { 'Authorization': `tma ${initData}`, Accept: "application/json" } })
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

const SAMPLE_PROFILE = { name: "???", height: 0, weight: 0 }

export async function fetchProfile() {
  try {
    const res = await fetch("/api/profile", { headers: { 'Authorization': `tma ${initData}`, Accept: "application/json" } })
    if (!res.ok) throw new Error(`Не удалось загрузить профиль (${res.status})`)
    return await res.json()
  } catch (err) {
    if (import.meta.env.DEV) {
      console.warn("[Kore] /api/profile недоступен, используются тестовые данные:", err.message)
      return SAMPLE_PROFILE
    }
    throw err
  }
}

export async function updateProfile(payload) {
  try {
    const res = await fetch("/api/profile", {
      method: "PUT",
      headers: { 'Authorization': `tma ${initData}`, "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(payload),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      if (import.meta.env.DEV && res.status >= 500) {
        console.warn("[Kore] /api/profile недоступен, изменение сохранено только для предпросмотра")
        return payload
      }
      throw new Error(data.error || `Не удалось сохранить профиль (${res.status})`)
    }
    return data
  } catch (err) {
    if (import.meta.env.DEV && err instanceof TypeError) return payload
    throw err
  }
}

export async function saveTraining(payload) {
  const res = await fetch("/api/training", {
    method: "POST",
    headers: { 'Authorization': `tma ${initData}`, "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(`Failed to save workout (${res.status})`)
  // Backend may return the created object or nothing; tolerate both.
  const text = await res.text()
  return text ? JSON.parse(text) : null
}
