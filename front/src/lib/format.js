import { getExercise } from "./exercises.js"

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

export function formatWeight(value) {
  return new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 1 }).format(value || 0)
}

export function progressExerciseIds(history, minimumSets = 2) {
  const totals = new Map()
  const recentOrder = []

  for (const training of history) {
    for (const exercise of training.exercises || []) {
      const id = Number(exercise.baseExercise)
      if (!recentOrder.includes(id)) recentOrder.push(id)
      totals.set(id, (totals.get(id) || 0) + (exercise.sets || []).length)
    }
  }

  return recentOrder.filter((id) => (totals.get(id) || 0) >= minimumSets)
}

export function exerciseProgress(history, exerciseId) {
  return history
    .map((training) => {
      const sets = (training.exercises || [])
        .filter((exercise) => Number(exercise.baseExercise) === Number(exerciseId))
        .flatMap((exercise) => exercise.sets || [])
        .filter((set) => Number(set.weight) >= 0 && Number(set.reps) > 0)

      if (!sets.length) return null
      const maxWeight = Math.max(...sets.map((set) => Number(set.weight) || 0))
      const estimatedOneRepMax = Math.max(
        ...sets.map((set) => (Number(set.weight) || 0) * (1 + (Number(set.reps) || 0) / 30)),
      )

      return {
        date: training.date,
        shortDate: new Intl.DateTimeFormat("ru-RU", { day: "2-digit", month: "2-digit" }).format(parseDate(training.date)),
        maxWeight: Number(maxWeight.toFixed(1)),
        estimatedOneRepMax: Number(estimatedOneRepMax.toFixed(1)),
      }
    })
    .filter(Boolean)
    .sort((a, b) => parseDate(a.date) - parseDate(b.date))
}

export function monthlyProgress(points) {
  if (points.length < 2) return null
  const latest = points.at(-1)
  const cutoff = parseDate(latest.date)
  cutoff.setDate(cutoff.getDate() - 30)
  const baseline = [...points].reverse().find((point) => parseDate(point.date) <= cutoff)

  if (!baseline) return null
  const change = latest.maxWeight - baseline.maxWeight
  return {
    change: Number(change.toFixed(1)),
    percent: baseline.maxWeight ? Number(((change / baseline.maxWeight) * 100).toFixed(1)) : null,
  }
}

export function muscleGroupVolume(history, muscleGroups, period = "week", now = new Date()) {
  const end = startOfDay(now)
  const start = period === "week" ? startOfWeek(end) : new Date(end)
  const periodDays = period === "week" ? 7 : period === "month" ? 30 : 90
  if (period !== "week") start.setDate(start.getDate() - periodDays + 1)

  const exerciseGroups = new Map()
  const groupIds = new Set(muscleGroups.map((group) => group.id))
  const totals = new Map(muscleGroups.map((group) => [group.id, { volume: 0, trainings: new Set() }]))

  for (const training of history) {
    const date = parseDate(training.date)
    if (!date || date < start || date > end) continue

    for (const exercise of training.exercises || []) {
      const exerciseId = Number(exercise.baseExercise)
      let muscleGroup = exerciseGroups.get(exerciseId)
      if (!muscleGroup) {
        muscleGroup = getExercise(exerciseId).muscleGroup
        exerciseGroups.set(exerciseId, muscleGroup)
      }
      if (!groupIds.has(muscleGroup)) continue

      const volume = (exercise.sets || []).reduce(
        (sum, set) => sum + (Number(set.weight) || 0) * (Number(set.reps) || 0),
        0,
      )
      totals.get(muscleGroup).volume += volume
      if ((exercise.sets || []).length > 0) {
        totals.get(muscleGroup).trainings.add(training.id ?? training.date)
      }
    }
  }

  const weeks = period === "week" ? 1 : periodDays / 7
  return muscleGroups.map((group) => ({
    ...group,
    volume: Number(totals.get(group.id).volume.toFixed(1)),
    frequency: Number((totals.get(group.id).trainings.size / weeks).toFixed(1)),
  }))
}
