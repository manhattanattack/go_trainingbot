export function cn(...args) {
  return args.filter(Boolean).join(" ")
}

// Parse a "YYYY-MM-DD" string as a local date (avoids timezone shifting).
export function parseDate(str) {
  if (!str) return null
  const [y, m, d] = str.split("-").map(Number)
  if (!y || !m || !d) return new Date(str)
  return new Date(y, m - 1, d)
}

export function toISODate(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

export function startOfDay(date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

export function daysBetween(a, b) {
  const ms = startOfDay(a).getTime() - startOfDay(b).getTime()
  return Math.round(ms / 86400000)
}

export function formatVolume(n) {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
  return `${Math.round(n)}`
}

export function formatFullDate(str) {
  const d = parseDate(str)
  if (!d) return ""
  return d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })
}

export function relativeDay(str) {
  const d = parseDate(str)
  if (!d) return ""
  const diff = daysBetween(new Date(), d)
  if (diff === 0) return "Today"
  if (diff === 1) return "Yesterday"
  if (diff > 1 && diff < 7) return `${diff} days ago`
  return formatFullDate(str)
}

// Volume for a single training entry.
export function trainingVolume(training) {
  let total = 0
  for (const ex of training.exercises || []) {
    for (const s of ex.sets || []) {
      total += (Number(s.weight) || 0) * (Number(s.reps) || 0)
    }
  }
  return total
}

export function trainingSetCount(training) {
  let count = 0
  for (const ex of training.exercises || []) count += (ex.sets || []).length
  return count
}
