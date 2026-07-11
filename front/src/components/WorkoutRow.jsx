import { ChevronRight } from "lucide-react"
import { InsetRow } from "./InsetList.jsx"
import ExerciseIcon from "./ExerciseIcon.jsx"
import { exerciseName, getExercise } from "../lib/exercises.js"
import { relativeDay, trainingVolume, trainingSetCount, formatVolume } from "../lib/format.js"

export default function WorkoutRow({ training, compact = false, onClick }) {
  const names = (training.exercises || []).map((e) => exerciseName(e.baseExercise))
  const primaryExercise = getExercise(training.exercises?.[0]?.baseExercise)
  const preview = names.slice(0, 2).join(", ") + (names.length > 2 ? ` +${names.length - 2}` : "")
  const sets = trainingSetCount(training)
  const volume = trainingVolume(training)

  const setWord = sets % 10 === 1 && sets % 100 !== 11 ? "подход" : sets % 10 >= 2 && sets % 10 <= 4 && (sets % 100 < 12 || sets % 100 > 14) ? "подхода" : "подходов"

  return (
    <InsetRow onClick={onClick} className={compact ? "py-2.5" : undefined}>
      <ExerciseIcon
        muscleGroup={primaryExercise.muscleGroup}
        equipment={primaryExercise.equipment}
        size={20}
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <span className="font-display text-[15px] font-600 text-ink">{relativeDay(training.date)}</span>
          <span className="shrink-0 text-[13px] font-500 text-accent">{formatVolume(volume)} кг</span>
        </div>
        <p className="truncate text-[13px] text-ink-muted">
          {preview || "Нет упражнений"} · {sets} {setWord}
        </p>
      </div>
      <ChevronRight size={18} className="shrink-0 text-ink-faint" />
    </InsetRow>
  )
}
