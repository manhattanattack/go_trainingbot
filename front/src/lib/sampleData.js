// Sample workout history for local preview when the Go backend is offline.
// Matches the exact shape of GET /me. Dates are generated relative to today.
import { toISODate } from "./format.js"

function daysAgo(n) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return toISODate(d)
}

let setId = 100
const s = (weight, reps, rpe) => ({ setId: setId++, weight, reps, rpe, note: "" })

export const SAMPLE_HISTORY = []
