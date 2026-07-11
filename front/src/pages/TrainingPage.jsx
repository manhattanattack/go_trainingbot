import { useMemo, useState } from "react"
import { Plus, Calendar, Check, Loader2, ClipboardList } from "lucide-react"
import TopBar from "../components/TopBar.jsx"
import ExerciseCard from "../components/ExerciseCard.jsx"
import ExercisePicker from "../components/ExercisePicker.jsx"
import { saveTraining } from "../lib/api.js"
import { toISODate, formatVolume } from "../lib/format.js"

function emptySet() {
  return { weight: "", reps: "", rpe: "", note: "" }
}

export default function TrainingPage({ onSaved, goToOverview }) {
  const [date, setDate] = useState(() => toISODate(new Date()))
  const [exercises, setExercises] = useState([])
  const [pickerOpen, setPickerOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState(null) // { type: 'error' | 'success', message }

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
            <div className="rounded-2xl border border-dashed border-hairline-strong bg-card/40 px-6 py-12 text-center">
              <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-accent-soft text-accent">
                <ClipboardList size={22} />
              </span>
              <p className="font-display text-[15px] font-600 text-ink">Тренировка пока пуста</p>
              <p className="mt-1 text-[13px] text-ink-muted">Добавьте упражнение, чтобы записать подходы.</p>
            </div>
          ) : (
            exercises.map((ex, i) => (
              <ExerciseCard
                key={i}
                exercise={ex}
                index={i}
                onUpdate={(next) => updateExercise(i, next)}
                onRemove={() => removeExercise(i)}
              />
            ))
          )}

          <button
            onClick={() => setPickerOpen(true)}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-hairline bg-card py-3.5 font-display text-[15px] font-600 text-ink transition-colors active:bg-card-2"
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

        {/* Spacer so content clears the sticky save bar */}
        <div className="h-20" aria-hidden="true" />
      </div>

      {/* Sticky save bar */}
      <div
        className="fixed inset-x-0 bottom-[68px] z-20 mx-auto max-w-md border-t border-hairline bg-surface/80 px-4 py-3 backdrop-blur-xl"
      >
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-accent py-4 font-display text-[16px] font-700 text-surface shadow-lg shadow-accent/20 transition-transform active:scale-[0.98] disabled:opacity-60"
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

      <ExercisePicker open={pickerOpen} onClose={() => setPickerOpen(false)} onSelect={addExercise} />
    </>
  )
}

function Summary({ label, value, unit }) {
  return (
    <div className="rounded-2xl border border-hairline bg-card px-3 py-3 text-center">
      <div className="flex items-baseline justify-center gap-1">
        <span className="font-display text-[22px] font-800 leading-none text-ink">{value}</span>
        {unit && <span className="text-[12px] font-500 text-ink-muted">{unit}</span>}
      </div>
      <p className="mt-1 text-[11px] font-500 uppercase tracking-wide text-ink-faint">{label}</p>
    </div>
  )
}
