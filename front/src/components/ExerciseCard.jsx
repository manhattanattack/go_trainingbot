import { Plus, Trash2, X } from "lucide-react"
import { exerciseName, getExercise } from "../lib/exercises.js"

function SetInput({ value, onChange, placeholder, ariaLabel }) {
  return (
    <input
      type="number"
      inputMode="decimal"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      aria-label={ariaLabel}
      className="w-full rounded-lg bg-card-2 py-2 text-center font-display text-[15px] font-600 text-ink outline-none ring-accent transition placeholder:font-400 placeholder:text-ink-faint focus:ring-2"
    />
  )
}

export default function ExerciseCard({ exercise, index, onUpdate, onRemove }) {
  const meta = getExercise(exercise.baseExercise)

  const updateSet = (setIdx, field, val) => {
    const sets = exercise.sets.map((s, i) => (i === setIdx ? { ...s, [field]: val } : s))
    onUpdate({ ...exercise, sets })
  }

  const addSet = () => {
    const last = exercise.sets[exercise.sets.length - 1]
    const next = last
      ? { weight: last.weight, reps: last.reps, rpe: last.rpe, note: "" }
      : { weight: "", reps: "", rpe: "", note: "" }
    onUpdate({ ...exercise, sets: [...exercise.sets, next] })
  }

  const removeSet = (setIdx) => {
    onUpdate({ ...exercise, sets: exercise.sets.filter((_, i) => i !== setIdx) })
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-hairline bg-card">
      <div className="flex items-center justify-between gap-2 px-4 py-3">
        <div className="min-w-0">
          <p className="text-[11px] font-500 uppercase tracking-wide text-accent">{meta.group}</p>
          <h3 className="truncate font-display text-[16px] font-700 text-ink">
            {exerciseName(exercise.baseExercise)}
          </h3>
        </div>
        <button
          onClick={onRemove}
          aria-label={`Remove ${exerciseName(exercise.baseExercise)}`}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-card-2 text-ink-faint active:bg-hairline-strong active:text-ink"
        >
          <Trash2 size={16} />
        </button>
      </div>

      {/* Header row */}
      <div className="grid grid-cols-[2rem_1fr_1fr_1fr_2rem] items-center gap-2 border-t border-hairline px-4 py-2 text-[11px] font-500 uppercase tracking-wide text-ink-faint">
        <span className="text-center">Set</span>
        <span className="text-center">Kg</span>
        <span className="text-center">Reps</span>
        <span className="text-center">RPE</span>
        <span />
      </div>

      <div className="divide-y divide-hairline">
        {exercise.sets.map((set, i) => (
          <div
            key={i}
            className="grid grid-cols-[2rem_1fr_1fr_1fr_2rem] items-center gap-2 px-4 py-2"
          >
            <span className="flex h-6 w-6 items-center justify-center justify-self-center rounded-full bg-accent-soft font-display text-[13px] font-700 text-accent">
              {i + 1}
            </span>
            <SetInput
              value={set.weight}
              onChange={(v) => updateSet(i, "weight", v)}
              placeholder="0"
              ariaLabel={`Set ${i + 1} weight`}
            />
            <SetInput
              value={set.reps}
              onChange={(v) => updateSet(i, "reps", v)}
              placeholder="0"
              ariaLabel={`Set ${i + 1} reps`}
            />
            <SetInput
              value={set.rpe}
              onChange={(v) => updateSet(i, "rpe", v)}
              placeholder="-"
              ariaLabel={`Set ${i + 1} RPE`}
            />
            <button
              onClick={() => removeSet(i)}
              aria-label={`Remove set ${i + 1}`}
              disabled={exercise.sets.length === 1}
              className="flex h-6 w-6 items-center justify-center justify-self-center rounded-full text-ink-faint transition active:text-ink disabled:opacity-30"
            >
              <X size={15} />
            </button>
          </div>
        ))}
      </div>

      <button
        onClick={addSet}
        className="flex w-full items-center justify-center gap-1.5 border-t border-hairline py-3 text-[14px] font-600 text-accent transition-colors active:bg-card-2"
      >
        <Plus size={16} strokeWidth={2.5} />
        Add Set
      </button>
    </div>
  )
}
