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

// Calendar weeks run from Monday through Sunday.
export function startOfWeek(date) {
  const d = startOfDay(date)
  const daysSinceMonday = (d.getDay() + 6) % 7
  d.setDate(d.getDate() - daysSinceMonday)
  return d
}

export function countTrainingsInLastDays(history, days = 15, now = new Date()) {
  return history.reduce((count, training) => {
    const date = parseDate(training.date)
    if (!date) return count
    const age = daysBetween(now, date)
    return age >= 0 && age < days ? count + 1 : count
  }, 0)
}

export function completedWeekStreak(history, weeklyGoal = 3, now = new Date()) {
  const currentWeekStart = startOfWeek(now)
  const counts = new Map()

  for (const training of history) {
    const date = parseDate(training.date)
    if (!date || date >= currentWeekStart) continue
    const weekKey = toISODate(startOfWeek(date))
    counts.set(weekKey, (counts.get(weekKey) || 0) + 1)
  }

  let streak = 0
  const week = new Date(currentWeekStart)
  week.setDate(week.getDate() - 7)

  while ((counts.get(toISODate(week)) || 0) >= weeklyGoal) {
    streak += 1
    week.setDate(week.getDate() - 7)
  }

  return streak
}

export function formatVolume(n) {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
  return `${Math.round(n)}`
}

export function formatFullDate(str) {
  const d = parseDate(str)
  if (!d) return ""
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(d)
}

function dayWord(number) {
  const lastTwo = number % 100
  const last = number % 10
  if (lastTwo >= 11 && lastTwo <= 14) return "дней"
  if (last === 1) return "день"
  if (last >= 2 && last <= 4) return "дня"
  return "дней"
}

export function relativeDay(str) {
  const d = parseDate(str)
  if (!d) return ""
  const diff = daysBetween(new Date(), d)
  if (diff === 0) return "Сегодня"
  if (diff === 1) return "Вчера"
  if (diff > 1 && diff < 7) return `${diff} ${dayWord(diff)} назад`
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
