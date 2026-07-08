import { useMemo, useRef, useEffect } from "react"
import { cn, toISODate, startOfDay } from "../lib/format.js"

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"]

// Horizontal strip of the last `days` days; workout days get the bronze ring.
export default function CalendarStrip({ workoutDates, days = 15 }) {
  const scrollRef = useRef(null)

  const items = useMemo(() => {
    const today = startOfDay(new Date())
    const out = []
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(today)
      d.setDate(today.getDate() - i)
      const iso = toISODate(d)
      out.push({
        iso,
        dayNum: d.getDate(),
        weekday: WEEKDAYS[d.getDay()],
        isToday: i === 0,
        hasWorkout: workoutDates.has(iso),
      })
    }
    return out
  }, [workoutDates, days])

  useEffect(() => {
    // Keep today (rightmost) in view.
    const el = scrollRef.current
    if (el) el.scrollLeft = el.scrollWidth
  }, [items])

  return (
    <div ref={scrollRef} className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
      {items.map((it) => (
        <div key={it.iso} className="flex flex-col items-center gap-1.5">
          <span className="text-[11px] font-500 text-ink-faint">{it.weekday}</span>
          <div
            className={cn(
              "flex h-11 w-11 items-center justify-center rounded-full font-display text-[15px] font-600 transition-colors",
              it.hasWorkout
                ? "bg-accent text-surface"
                : "bg-card text-ink-muted",
              it.isToday && !it.hasWorkout && "ring-2 ring-accent ring-offset-2 ring-offset-surface",
              it.isToday && it.hasWorkout && "ring-2 ring-accent-strong ring-offset-2 ring-offset-surface",
            )}
          >
            {it.dayNum}
          </div>
        </div>
      ))}
    </div>
  )
}
