import { useEffect, useMemo, useRef, useState } from "react"
import { X } from "lucide-react"
import {
  cn,
  formatFullDate,
  formatVolume,
  parseDate,
  startOfDay,
  toISODate,
  trainingVolume,
} from "../lib/format.js"
import { getExercise } from "../lib/exercises.js"
import { hapticImpact } from "../lib/haptics.js"

const WEEKDAYS = ["вс", "пн", "вт", "ср", "чт", "пт", "сб"]
const LONG_PRESS_MS = 450

// Horizontal strip of the last `days` days; workout days reflect daily training volume.
export default function CalendarStrip({ workoutDates, history = [], days = 15 }) {
  const scrollRef = useRef(null)
  const pressTimerRef = useRef(null)
  const pressStartRef = useRef(null)
  const [preview, setPreview] = useState(null)

  const dailyWorkouts = useMemo(() => {
    const grouped = new Map()
    for (const training of history) {
      const date = parseDate(training.date)
      if (!date) continue
      const iso = toISODate(date)
      const existing = grouped.get(iso) || []
      grouped.set(iso, [...existing, training])
    }
    return grouped
  }, [history])

  const visibleVolumes = useMemo(() => {
    const today = startOfDay(new Date())
    const firstDay = new Date(today)
    firstDay.setDate(today.getDate() - days + 1)
    const volumes = new Map()

    for (const [iso, trainings] of dailyWorkouts) {
      const date = parseDate(iso)
      if (date && date >= firstDay && date <= today) {
        volumes.set(iso, trainings.reduce((sum, training) => sum + trainingVolume(training), 0))
      }
    }
    return volumes
  }, [dailyWorkouts, days])

  const averageVolume = useMemo(() => {
    const values = [...visibleVolumes.values()]
    return values.length ? values.reduce((sum, volume) => sum + volume, 0) / values.length : 0
  }, [visibleVolumes])

  const items = useMemo(() => {
    const today = startOfDay(new Date())
    const out = []
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(today)
      d.setDate(today.getDate() - i)
      const iso = toISODate(d)
      const hasWorkout = workoutDates.has(iso)
      const volume = visibleVolumes.get(iso) || 0
      const intensity = !hasWorkout
        ? null
        : volume < averageVolume * 0.85
          ? "low"
          : volume > averageVolume * 1.15
            ? "high"
            : "medium"
      const fullDate = new Intl.DateTimeFormat("ru-RU", {
        weekday: "long",
        day: "numeric",
        month: "long",
      }).format(d)
      out.push({
        iso,
        dayNum: d.getDate(),
        weekday: WEEKDAYS[d.getDay()],
        isToday: i === 0,
        hasWorkout,
        intensity,
        label: `${i === 0 ? "Сегодня, " : ""}${fullDate}. ${hasWorkout ? `Есть тренировка, объём ${formatVolume(volume)}` : "Без тренировки"}`,
      })
    }
    return out
  }, [workoutDates, days, visibleVolumes, averageVolume])

  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollLeft = el.scrollWidth
  }, [items])

  useEffect(() => {
    if (!preview) return undefined
    const onKeyDown = (event) => {
      if (event.key === "Escape") setPreview(null)
    }
    document.addEventListener("keydown", onKeyDown)
    return () => document.removeEventListener("keydown", onKeyDown)
  }, [preview])

  useEffect(() => () => clearTimeout(pressTimerRef.current), [])

  function cancelLongPress() {
    clearTimeout(pressTimerRef.current)
    pressTimerRef.current = null
    pressStartRef.current = null
  }

  function startLongPress(event, item) {
    if (!item.hasWorkout) return
    pressStartRef.current = { x: event.clientX, y: event.clientY }
    pressTimerRef.current = setTimeout(() => {
      const trainings = dailyWorkouts.get(item.iso) || []
      hapticImpact("medium")
      setPreview({ iso: item.iso, trainings })
      pressTimerRef.current = null
      pressStartRef.current = null
    }, LONG_PRESS_MS)
  }

  function handlePointerMove(event) {
    if (!pressStartRef.current) return
    const distance = Math.hypot(
      event.clientX - pressStartRef.current.x,
      event.clientY - pressStartRef.current.y,
    )
    if (distance > 8) cancelLongPress()
  }

  return (
    <>
      <div
        ref={scrollRef}
        role="list"
        aria-label={`Активность за последние ${days} дней`}
        className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1"
      >
        {items.map((item) => (
          <time
            key={item.iso}
            dateTime={item.iso}
            role="listitem"
            aria-label={`${item.label}${item.hasWorkout ? ". Удерживайте, чтобы посмотреть тренировку" : ""}`}
            tabIndex={item.hasWorkout ? 0 : undefined}
            onPointerDown={(event) => startLongPress(event, item)}
            onPointerMove={handlePointerMove}
            onPointerUp={cancelLongPress}
            onPointerCancel={cancelLongPress}
            onPointerLeave={cancelLongPress}
            onKeyDown={(event) => {
              if (item.hasWorkout && (event.key === "Enter" || event.key === " ")) {
                event.preventDefault()
                setPreview({ iso: item.iso, trainings: dailyWorkouts.get(item.iso) || [] })
              }
            }}
            className={cn(
              "flex flex-col items-center gap-1.5 rounded-full outline-none",
              item.hasWorkout && "cursor-pointer touch-pan-x focus-visible:ring-2 focus-visible:ring-accent",
            )}
          >
            <span aria-hidden="true" className="text-[11px] font-500 text-ink-faint">{item.weekday}</span>
            <span
              aria-hidden="true"
              className={cn(
                "flex h-11 w-11 items-center justify-center rounded-full font-display text-[15px] font-600 transition-colors",
                !item.hasWorkout && "bg-card text-ink-muted",
                item.hasWorkout && item.intensity === "low" && "scale-[0.78] bg-accent/45 text-ink",
                item.hasWorkout && item.intensity === "medium" && "scale-90 bg-accent/75 text-surface",
                item.hasWorkout && item.intensity === "high" && "bg-accent text-surface",
                item.isToday && "ring-2 ring-accent-strong ring-offset-2 ring-offset-surface",
              )}
            >
              {item.dayNum}
            </span>
          </time>
        ))}
      </div>

      {preview && <WorkoutPreview preview={preview} onClose={() => setPreview(null)} />}
    </>
  )
}

function WorkoutPreview({ preview, onClose }) {
  const [closing, setClosing] = useState(false)
  const requestClose = () => {
    if (closing) return
    setClosing(true)
    window.setTimeout(onClose, 240)
  }
  const exercises = preview.trainings.flatMap((training) => training.exercises || [])
  const totalVolume = preview.trainings.reduce((sum, training) => sum + trainingVolume(training), 0)

  return (
    <div
      className={`fixed inset-0 z-50 flex items-end bg-ink/45 transition-opacity duration-200 ${closing ? "opacity-0" : "opacity-100"}`}
      role="presentation"
      onPointerDown={(event) => {
        if (event.target === event.currentTarget) requestClose()
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="workout-preview-title"
        className={`max-h-[78vh] w-full overflow-y-auto rounded-t-3xl border border-hairline bg-surface px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-3 shadow-2xl transition-all duration-200 motion-reduce:transition-none ${closing ? "translate-y-6 opacity-0" : "translate-y-0 opacity-100"}`}
      >
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-ink-faint/40" />
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[12px] font-500 uppercase tracking-wide text-ink-faint">Тренировка</p>
            <h2 id="workout-preview-title" className="font-display text-[20px] font-700 text-ink">
              {formatFullDate(preview.iso)}
            </h2>
          </div>
          <button
            type="button"
            onClick={requestClose}
            aria-label="Закрыть превью тренировки"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-card text-ink-muted transition-colors active:bg-card-2"
          >
            <X size={20} />
          </button>
        </div>

        <div className="mt-4 overflow-hidden rounded-2xl border border-hairline bg-card">
          <div className="divide-y divide-hairline">
            {exercises.map((exercise) => {
              const info = getExercise(exercise.baseExercise)
              const setCount = exercise.sets?.length || 0
              return (
                <div key={exercise.exerciseId} className="flex items-center justify-between gap-3 px-4 py-3">
                  <span className="min-w-0 truncate text-[14px] font-600 text-ink">{info.name}</span>
                  <span className="shrink-0 text-[13px] text-ink-muted">
                    {setCount} {setLabel(setCount)}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between rounded-2xl bg-card px-4 py-3">
          <span className="text-[13px] font-500 text-ink-muted">Общий тоннаж</span>
          <span className="font-display text-[18px] font-700 text-accent">{formatVolume(totalVolume)}</span>
        </div>
      </section>
    </div>
  )
}

function setLabel(number) {
  const lastTwo = number % 100
  const last = number % 10
  if (lastTwo >= 11 && lastTwo <= 14) return "подходов"
  if (last === 1) return "подход"
  if (last >= 2 && last <= 4) return "подхода"
  return "подходов"
}
