import { useMemo, useState } from "react"
import { Plus, Calendar, Check, Loader2, ClipboardList, RotateCcw, ChevronRight } from "lucide-react"
import TopBar from "../components/TopBar.jsx"
import ExerciseCard from "../components/ExerciseCard.jsx"
import ExercisePicker from "../components/ExercisePicker.jsx"
import { saveTraining } from "../lib/api.js"
import { toISODate, formatVolume, parseDate, relativeDay, previousExerciseBest } from "../lib/format.js"
import { exerciseName } from "../lib/exercises.js"

function emptySet() {
  return { weight: "", reps: "", rpe: "", note: "" }
}

export default function TrainingPage({
  history = [],
  historyLoading = false,
  onSaved,
  goToOverview,
  date,
  setDate,
  exercises,
  setExercises,
}) {
  const [pickerOpen, setPickerOpen] = useState(false)
  const [exerciseAddVersion, setExerciseAddVersion] = useState(0)
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState(null) // { type: 'error' | 'success', message }

  const lastTraining = useMemo(() => {
    return history.reduce((latest, training) => {
      const trainingDate = parseDate(training.date)
      if (!trainingDate || Number.isNaN(trainingDate.getTime())) return latest
      if (!latest) return training
      const latestDate = parseDate(latest.date)
      return !latestDate || trainingDate > latestDate ? training : latest
    }, null)
  }, [history])

  const lastExerciseNames = useMemo(
    () => (lastTraining?.exercises || []).map((exercise) => exerciseName(exercise.baseExercise)).join(", "),
    [lastTraining],
  )

  const repeatLastTraining = () => {
    const repeatedExercises = (lastTraining?.exercises || []).map((exercise) => ({
      baseExercise: exercise.baseExercise,
      sets: [emptySet()],
    }))
    if (repeatedExercises.length === 0) return
    setExercises(repeatedExercises)
    setExerciseAddVersion((version) => version + 1)
    setStatus(null)
  }

  const totalVolume = useMemo(() => {
    let v = 0
    for (const ex of exercises) {
      for (const s of ex.sets) v += (Number(s.weight) || 0) * (Number(s.reps) || 0)
    }
    return v
  }, [exercises])

  const totalSets = useMemo(
    () => exercises.reduce((acc, ex) => acc + ex.sets.length, 0),
    [exercises],
  )

  const addExercise = (baseExercise) => {
    setExercises((prev) => [...prev, { baseExercise, sets: [emptySet()] }])
    setExerciseAddVersion((version) => version + 1)
    setPickerOpen(false)
  }

  const updateExercise = (idx, next) => {
    setExercises((prev) => prev.map((e, i) => (i === idx ? next : e)))
  }

  const removeExercise = (idx) => {
    setExercises((prev) => prev.filter((_, i) => i !== idx))
  }

  const buildPayload = () => ({
    date,
    exercises: exercises.map((ex) => ({
      baseExercise: ex.baseExercise,
      sets: ex.sets.map((s) => ({
        weight: Number(s.weight) || 0,
        reps: Number(s.reps) || 0,
        rpe: Number(s.rpe) || 0,
        note: s.note || "",
      })),
    })),
  })

  const handleSave = async () => {
    if (exercises.length === 0) {
      setStatus({ type: "error", message: "Сначала добавьте хотя бы одно упражнение." })
      return
    }
    setSaving(true)
    setStatus(null)
    try {
      await saveTraining(buildPayload())
      setStatus({ type: "success", message: "Тренировка сохранена." })
      setExercises([])
      setDate(toISODate(new Date()))
      onSaved?.()
      setTimeout(() => goToOverview?.(), 700)
    } catch (err) {
      setStatus({ type: "error", message: err.message || "Не удалось сохранить тренировку." })
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <TopBar title="Запись тренировки" />

      <div className="space-y-4 pt-4">
        {/* Date picker */}
        <section className="px-4">
          <label className="flex items-center justify-between rounded-2xl border border-hairline bg-card px-4 py-3">
            <span className="flex items-center gap-2.5 text-[15px] font-500 text-ink">
              <Calendar size={18} className="text-accent" />
              Дата
            </span>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="rounded-lg bg-card-2 px-3 py-1.5 font-display text-[14px] font-600 text-ink outline-none [color-scheme:dark]"
            />
          </label>
        </section>

        {/* Session summary */}
        {exercises.length > 0 && (
          <section className="grid grid-cols-3 gap-3 px-4">
            <Summary label="Упражнения" value={exercises.length} />
            <Summary label="Подходы" value={totalSets} />
            <Summary label="Объём" value={`${formatVolume(totalVolume)}`} unit="кг" />
          </section>
        )}

        {/* Exercise list */}
        <div className="space-y-3 px-4">
          {exercises.length === 0 ? (
            <div className="flex flex-col gap-3">
              <div className="rounded-2xl border border-dashed border-hairline-strong bg-card/40 px-6 py-8 text-center">
                <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-accent-soft text-accent">
                  <ClipboardList size={22} />
                </span>
                <p className="font-display text-[15px] font-600 text-ink">Тренировка пока пуста</p>
                <p className="mt-1 text-[13px] text-ink-muted">
                  Добавьте упражнение, чтобы записать подходы.
                </p>
              </div>

              {!historyLoading && lastTraining && lastExerciseNames && (
                <button
                  type="button"
                  onClick={repeatLastTraining}
                  aria-label={`Повторить тренировку ${relativeDay(lastTraining.date)}: ${lastExerciseNames}`}
                  className="tap-feedback flex w-full items-center gap-3 rounded-2xl border border-hairline bg-card p-4 text-left active:bg-card-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent">
                    <RotateCcw size={19} strokeWidth={2.25} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-display text-[14px] font-700 text-ink">
                      Повторить прошлую тренировку
                    </span>
                    <span className="mt-0.5 block text-[12px] font-500 text-ink-muted">
                      {relativeDay(lastTraining.date)}
                    </span>
                    <span className="mt-1 block truncate text-[12px] text-ink-faint">
                      {lastExerciseNames}
                    </span>
                  </span>
                  <ChevronRight size={18} className="shrink-0 text-ink-faint" aria-hidden="true" />
                </button>
              )}
            </div>
          ) : (
            exercises.map((ex, i) => (
              <ExerciseCard
                key={i}
                exercise={ex}
                index={i}
                collapseVersion={exerciseAddVersion}
                isLatest={i === exercises.length - 1}
                previousBest={previousExerciseBest(history, ex.baseExercise, date)}
                onUpdate={(next) => updateExercise(i, next)}
                onRemove={() => removeExercise(i)}
              />
            ))
          )}

          <button
            onClick={() => setPickerOpen(true)}
            className="tap-feedback flex w-full items-center justify-center gap-2 rounded-2xl border border-hairline bg-card py-3.5 font-display text-[15px] font-600 text-ink active:bg-card-2"
          >
            <Plus size={18} strokeWidth={2.5} className="text-accent" />
            Добавить упражнение
          </button>
        </div>

        {status && (
          <div className="px-4">
            <p
              className={
                status.type === "error"
                  ? "rounded-xl bg-card px-4 py-2.5 text-center text-[13px] font-500 text-accent-strong"
                  : "rounded-xl bg-accent-soft px-4 py-2.5 text-center text-[13px] font-600 text-accent"
              }
            >
              {status.message}
            </p>
          </div>
        )}

        {exercises.length > 0 && (
          <div className="h-20" aria-hidden="true" />
        )}
      </div>

      {exercises.length > 0 && (
        <div className="fixed inset-x-0 bottom-[68px] z-20 mx-auto max-w-md border-t border-hairline bg-surface/80 px-4 py-3 backdrop-blur-xl">
          <button
            onClick={handleSave}
            disabled={saving}
            className="tap-feedback flex w-full items-center justify-center gap-2 rounded-2xl bg-accent py-4 font-display text-[16px] font-700 text-surface shadow-lg shadow-accent/20 disabled:opacity-60"
          >
            {saving ? (
              <>
                <Loader2 size={19} className="animate-spin" />
                Сохранение...
              </>
            ) : (
              <>
                <Check size={19} strokeWidth={2.5} />
                Сохранить тренировку
              </>
            )}
          </button>
        </div>
      )}

      <ExercisePicker open={pickerOpen} onClose={() => setPickerOpen(false)} onSelect={addExercise} />
    </>
  )
}

function Summary({ label, value, unit }) {
  return (
    <div className="min-w-0 rounded-2xl border border-hairline bg-card px-2 py-3 text-center">
      <div className="flex items-baseline justify-center gap-1">
        <span className="font-display text-[22px] font-800 leading-none text-ink">{value}</span>
        {unit && <span className="text-[11px] font-500 text-ink-muted">{unit}</span>}
      </div>
      <p className="mt-1 truncate text-[9px] font-500 uppercase tracking-normal text-ink-faint sm:text-[10px] sm:tracking-wide">
        {label}
      </p>
    </div>
  )
}
