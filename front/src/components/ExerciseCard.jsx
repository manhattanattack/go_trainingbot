import { useEffect, useRef, useState } from "react"
import { Copy, HelpCircle, Plus, Trash2, X } from "lucide-react"
import ExerciseIcon from "./ExerciseIcon.jsx"
import { exerciseName, getExercise } from "../lib/exercises.js"

const RPE_VALUES = [6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5, 10]
const SWIPE_REVEAL = 76
const DUPLICATE_THRESHOLD = 88

function SetInput({ value, onChange, placeholder, ariaLabel, step = 1 }) {
  return (
    <input
      type="number"
      inputMode="decimal"
      min="0"
      step={step}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      aria-label={ariaLabel}
      className="h-10 w-full min-w-0 rounded-xl border border-hairline bg-card px-2 text-center font-display text-[16px] font-700 text-ink outline-none ring-accent transition placeholder:font-400 placeholder:text-ink-faint focus:ring-2"
    />
  )
}

function SetCard({ set, number, collapsed, canDelete, onExpand, onChange, onDuplicate, onRemove, onRpeHelp }) {
  const start = useRef(null)
  const [offset, setOffset] = useState(0)
  const [dragging, setDragging] = useState(false)

  const resetPointer = (event) => {
    start.current = null
    setDragging(false)
    event.currentTarget.releasePointerCapture?.(event.pointerId)
  }

  const handlePointerDown = (event) => {
    if (event.pointerType === "mouse" || event.target.closest("input, button")) return
    start.current = { x: event.clientX, y: event.clientY, direction: null }
    setDragging(true)
    event.currentTarget.setPointerCapture?.(event.pointerId)
  }

  const handlePointerMove = (event) => {
    if (!start.current) return
    const dx = event.clientX - start.current.x
    const dy = event.clientY - start.current.y

    if (!start.current.direction && Math.max(Math.abs(dx), Math.abs(dy)) > 8) {
      start.current.direction = Math.abs(dx) > Math.abs(dy) * 1.15 ? "horizontal" : "vertical"
    }
    if (start.current.direction !== "horizontal") return

    event.preventDefault()
    setOffset(Math.max(-SWIPE_REVEAL, Math.min(110, dx)))
  }

  const handlePointerUp = (event) => {
    if (!start.current) return
    const direction = start.current.direction
    const finalOffset = offset
    resetPointer(event)

    if (direction !== "horizontal") return
    if (finalOffset >= DUPLICATE_THRESHOLD) {
      setOffset(0)
      onDuplicate()
      return
    }
    setOffset(finalOffset <= -42 && canDelete ? -SWIPE_REVEAL : 0)
  }

  return (
    <div className="relative overflow-hidden rounded-2xl bg-card-2">
      <div className="absolute inset-y-0 right-0 flex w-[76px] items-center justify-center bg-accent-strong">
        <button
          type="button"
          onClick={onRemove}
          disabled={!canDelete}
          aria-label={`Удалить подход ${number}`}
          className="flex h-full w-full flex-col items-center justify-center gap-1 text-surface disabled:opacity-40"
        >
          <Trash2 size={18} />
          <span className="text-[11px] font-600">Удалить</span>
        </button>
      </div>

      <article
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={(event) => {
          resetPointer(event)
          setOffset(0)
        }}
        style={{
          transform: `translateX(${offset}px)`,
          touchAction: "pan-y",
          transition: dragging ? "none" : "transform 220ms cubic-bezier(0.22, 1, 0.36, 1)",
        }}
        className="relative z-10 border border-hairline bg-card-2 px-3 py-3"
      >
        <div className="mb-2 flex items-center justify-between gap-3">
          <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-accent-soft px-2 font-display text-[12px] font-700 text-accent">
            {number}
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={onDuplicate}
              aria-label={`Дублировать подход ${number}`}
              className="flex h-7 w-7 items-center justify-center rounded-full text-ink-faint transition active:bg-hairline active:text-ink"
            >
              <Copy size={14} />
            </button>
            <button
              type="button"
              onClick={onRemove}
              disabled={!canDelete}
              aria-label={`Удалить подход ${number}`}
              className="flex h-7 w-7 items-center justify-center rounded-full text-ink-faint transition active:bg-hairline active:text-accent-strong disabled:opacity-30"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>

        {collapsed ? (
          <button
            type="button"
            onClick={onExpand}
            className="animate-fade flex w-full items-center justify-between gap-3 rounded-xl border border-hairline bg-card px-3 py-2.5 text-left transition-colors active:bg-hairline"
            aria-label={`Развернуть подход ${number}`}
          >
            <span className="text-[12px] font-600 text-ink-muted">Подход завершён</span>
            <span className="font-display text-[14px] font-700 text-ink">
              {set.weight || 0} кг × {set.reps || 0}
              {set.rpe ? <span className="ml-2 text-accent">RPE {set.rpe}</span> : null}
            </span>
          </button>
        ) : (
          <div className="grid gap-3">
        <div className="grid grid-cols-2 gap-2">
          <label className="grid gap-1">
            <span className="text-[11px] font-600 uppercase tracking-wide text-ink-faint">Вес, кг</span>
            <SetInput
              value={set.weight}
              onChange={(value) => onChange("weight", value)}
              placeholder="0"
              ariaLabel={`Вес подхода ${number} в килограммах`}
              step={0.5}
            />
          </label>
          <label className="grid gap-1">
            <span className="text-[11px] font-600 uppercase tracking-wide text-ink-faint">Повторы</span>
            <SetInput
              value={set.reps}
              onChange={(value) => onChange("reps", value)}
              placeholder="0"
              ariaLabel={`Повторы подхода ${number}`}
            />
          </label>
        </div>

        <div className="mt-3">
          <div className="mb-1.5 flex items-center gap-1.5">
            <span className="text-[11px] font-600 uppercase tracking-wide text-ink-faint">RPE</span>
            <button
              type="button"
              onClick={onRpeHelp}
              aria-label="Что такое RPE"
              className="flex h-6 w-6 items-center justify-center rounded-full text-ink-faint active:bg-hairline active:text-accent"
            >
              <HelpCircle size={14} />
            </button>
          </div>
          <div className="rounded-xl border border-hairline bg-card p-1">
            <div className="flex items-center justify-between gap-0.5">
              {RPE_VALUES.map((value) => {
                const selected = Number(set.rpe) === value
                return (
                  <button
                    type="button"
                    key={value}
                    onClick={() => onChange("rpe", String(value))}
                    aria-label={`RPE ${value}`}
                    aria-pressed={selected}
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full font-display text-[11px] font-700 transition-all ${
                      selected
                        ? "bg-accent text-surface shadow-sm ring-2 ring-accent/20"
                        : "text-ink-muted active:bg-hairline active:text-ink"
                    }`}
                  >
                    {value}
                  </button>
                )
              })}
            </div>
            <div className="flex items-center justify-between px-1 pt-1 text-[9px] font-500 text-ink-faint" aria-hidden="true">
              <span>Легко</span>
              <span>Предел</span>
            </div>
          </div>
        </div>
          </div>
        )}
      </article>
    </div>
  )
}

function RpeHelpSheet({ open, onClose }) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" role="presentation">
      <button
        type="button"
        aria-label="Закрыть справку RPE"
        onClick={onClose}
        className="absolute inset-0 bg-surface/80 backdrop-blur-sm"
      />
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="rpe-help-title"
        className="relative z-10 w-full max-w-md rounded-t-3xl border border-hairline bg-card px-5 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-4 shadow-2xl"
      >
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-hairline-strong" aria-hidden="true" />
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-600 uppercase tracking-wide text-accent">Интенсивность</p>
            <h2 id="rpe-help-title" className="mt-1 font-display text-[20px] font-800 text-ink">
              Что такое RPE?
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Закрыть"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-card-2 text-ink-muted active:text-ink"
          >
            <X size={18} />
          </button>
        </div>
        <p className="mt-3 text-[14px] leading-relaxed text-ink-muted">
          Что такое RPE и как его оценивать. Подробное объяснение шкалы будет добавлено позже.
        </p>
        <button
          type="button"
          onClick={onClose}
          className="mt-5 w-full rounded-2xl bg-accent py-3.5 font-display text-[15px] font-700 text-surface active:opacity-90"
        >
          Понятно
        </button>
      </section>
    </div>
  )
}

export default function ExerciseCard({
  exercise,
  index,
  collapseVersion,
  isLatest,
  onUpdate,
  onRemove,
}) {
  const meta = getExercise(exercise.baseExercise)
  const [rpeHelpOpen, setRpeHelpOpen] = useState(false)
  const [activeSetIndex, setActiveSetIndex] = useState(() => Math.max(0, exercise.sets.length - 1))

  useEffect(() => {
    if (!isLatest) setActiveSetIndex(-1)
  }, [collapseVersion])

  const updateSet = (setIdx, field, value) => {
    const sets = exercise.sets.map((set, index) =>
      index === setIdx ? { ...set, [field]: value } : set,
    )
    onUpdate({ ...exercise, sets })
  }

  const duplicateSet = (setIdx) => {
    const source = exercise.sets[setIdx]
    const duplicate = { ...source, note: source.note || "" }
    const sets = [...exercise.sets]
    sets.splice(setIdx + 1, 0, duplicate)
    onUpdate({ ...exercise, sets })
    setActiveSetIndex(setIdx + 1)
  }

  const addSet = () => {
    const last = exercise.sets[exercise.sets.length - 1]
    const next = last
      ? { weight: last.weight, reps: last.reps, rpe: last.rpe, note: "" }
      : { weight: "", reps: "", rpe: "", note: "" }
    onUpdate({ ...exercise, sets: [...exercise.sets, next] })
    setActiveSetIndex(exercise.sets.length)
  }

  const removeSet = (setIdx) => {
    if (exercise.sets.length === 1) return
    onUpdate({ ...exercise, sets: exercise.sets.filter((_, index) => index !== setIdx) })
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-hairline bg-card">
      <div className="flex items-center justify-between gap-2 px-4 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <ExerciseIcon muscleGroup={meta.muscleGroup} equipment={meta.equipment} size={20} />
          <div className="min-w-0">
            <p className="text-[11px] font-500 uppercase tracking-wide text-accent">{meta.group}</p>
            <h3 className="truncate font-display text-[16px] font-700 text-ink">
              {exerciseName(exercise.baseExercise)}
            </h3>
          </div>
        </div>
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Удалить ${exerciseName(exercise.baseExercise)}`}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-card-2 text-ink-faint active:bg-hairline-strong active:text-ink"
        >
          <Trash2 size={16} />
        </button>
      </div>

      <div className="grid gap-2 border-t border-hairline p-3">
        {exercise.sets.map((set, setIndex) => (
          <SetCard
            key={setIndex}
            set={set}
            number={setIndex + 1}
            collapsed={activeSetIndex !== setIndex}
            canDelete={exercise.sets.length > 1}
            onExpand={() => setActiveSetIndex(setIndex)}
            onChange={(field, value) => updateSet(setIndex, field, value)}
            onDuplicate={() => duplicateSet(setIndex)}
            onRemove={() => removeSet(setIndex)}
            onRpeHelp={() => setRpeHelpOpen(true)}
          />
        ))}
      </div>

      <button
        type="button"
        onClick={addSet}
        className="flex w-full items-center justify-center gap-1.5 border-t border-hairline py-3 text-[14px] font-600 text-accent transition-colors active:bg-card-2"
      >
        <Plus size={16} strokeWidth={2.5} />
        Добавить подход
      </button>

      <RpeHelpSheet open={rpeHelpOpen} onClose={() => setRpeHelpOpen(false)} />
    </div>
  )
}
