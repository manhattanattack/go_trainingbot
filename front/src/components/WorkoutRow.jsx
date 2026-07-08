import { ChevronRight, Dumbbell } from "lucide-react"
import { InsetRow } from "./InsetList.jsx"
import { exerciseName } from "../lib/exercises.js"
import { relativeDay, trainingVolume, trainingSetCount, formatVolume } from "../lib/format.js"

export default function WorkoutRow({ training }) {
  const names = (training.exercises || []).map((e) => exerciseName(e.baseExercise))
  const preview = names.slice(0, 2).join(", ") + (names.length > 2 ? ` +${names.length - 2}` : "")
  const sets = trainingSetCount(training)
  const volume = trainingVolume(training)

  return (
    <InsetRow>
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent">
        <Dumbbell size={18} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <span className="font-display text-[15px] font-600 text-ink">{relativeDay(training.date)}</span>
          <span className="shrink-0 text-[13px] font-500 text-accent">{formatVolume(volume)} kg</span>
        </div>
        <p className="truncate text-[13px] text-ink-muted">
          {preview || "No exercises"} · {sets} {sets === 1 ? "set" : "sets"}
        </p>
      </div>
      <ChevronRight size={18} className="shrink-0 text-ink-faint" />
    </InsetRow>
  )
}
