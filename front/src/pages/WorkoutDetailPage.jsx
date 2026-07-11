import { ArrowLeft, CalendarDays, Dumbbell, Layers, Trophy } from "lucide-react"
import ExerciseIcon from "../components/ExerciseIcon.jsx"
import { exerciseName, getExercise } from "../lib/exercises.js"
import {
  estimatedOneRepMax,
  formatFullDate,
  formatVolume,
  formatWeight,
  trainingRecordSets,
  trainingSetCount,
  trainingVolume,
} from "../lib/format.js"

export default function WorkoutDetailPage({ training, history, onBack }) {
  if (!training) return null

  const volume = trainingVolume(training)
  const setCount = trainingSetCount(training)
  const records = trainingRecordSets(history, training)

  return (
    <div className="animate-fade pb-8">
      <header className="sticky top-0 z-30 border-b border-hairline bg-surface/90 px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))] backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            aria-label="Вернуться назад"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-card text-ink active:bg-card-2"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="min-w-0">
            <p className="text-[11px] font-600 uppercase tracking-[0.16em] text-accent">Дневник</p>
            <h1 className="truncate font-display text-[19px] font-800 text-ink">Детали тренировки</h1>
          </div>
        </div>
      </header>

      <main className="flex flex-col gap-5 px-4 pt-5">
        <section className="rounded-2xl border border-hairline bg-card p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="flex items-center gap-2 text-[12px] font-600 text-ink-muted">
                <CalendarDays size={15} className="text-accent" />
                {formatFullDate(training.date)}
              </p>
              <h2 className="mt-2 text-balance font-display text-[24px] font-800 leading-tight tracking-tight text-ink">
                Силовая тренировка
              </h2>
            </div>
            {records.size > 0 && (
              <span className="flex shrink-0 items-center gap-1 rounded-full bg-accent-soft px-2.5 py-1 text-[11px] font-700 text-accent">
                <Trophy size={13} /> {records.size} PR
              </span>
            )}
          </div>

          <div className="mt-5 grid grid-cols-3 divide-x divide-hairline border-t border-hairline pt-4">
            <Summary icon={Dumbbell} value={training.exercises?.length || 0} label="Упражнения" />
            <Summary icon={Layers} value={setCount} label="Подходы" />
            <Summary icon={Trophy} value={formatVolume(volume)} unit="кг" label="Тоннаж" />
          </div>
        </section>

        <section aria-labelledby="exercises-title">
          <div className="px-2 pb-3">
            <p className="text-[11px] font-600 uppercase tracking-[0.16em] text-ink-faint">Результаты</p>
            <h2 id="exercises-title" className="mt-1 font-display text-[18px] font-700 text-ink">Упражнения</h2>
          </div>
          <div className="flex flex-col gap-3">
            {(training.exercises || []).map((exercise, exerciseIndex) => (
              <ExerciseResult
                key={`${exercise.baseExercise}-${exerciseIndex}`}
                exercise={exercise}
                records={records}
              />
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}

function Summary({ icon: Icon, value, unit, label }) {
  return (
    <div className="min-w-0 px-2 text-center first:pl-0 last:pr-0">
      <Icon size={15} className="mx-auto text-accent" />
      <div className="mt-1.5 flex items-baseline justify-center gap-1">
        <span className="font-display text-[20px] font-800 leading-none text-ink">{value}</span>
        {unit && <span className="text-[10px] font-600 text-ink-muted">{unit}</span>}
      </div>
      <p className="mt-1 truncate text-[9px] font-600 uppercase tracking-wide text-ink-faint">{label}</p>
    </div>
  )
}

function ExerciseResult({ exercise, records }) {
  const meta = getExercise(exercise.baseExercise)
  const exerciseId = Number(exercise.baseExercise)

  return (
    <article className="overflow-hidden rounded-2xl border border-hairline bg-card">
      <header className="flex items-center gap-3 px-4 py-3.5">
        <ExerciseIcon muscleGroup={meta.muscleGroup} equipment={meta.equipment} size={20} />
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-600 uppercase tracking-wide text-accent">{meta.group}</p>
          <h3 className="truncate font-display text-[16px] font-700 text-ink">{exerciseName(exerciseId)}</h3>
        </div>
      </header>

      <div className="border-t border-hairline px-3 pb-3">
        <div className="grid grid-cols-[2rem_1fr_1fr_3.5rem] gap-2 px-2 py-2 text-[10px] font-600 uppercase tracking-wide text-ink-faint">
          <span>№</span><span>Вес</span><span>Повторы</span><span className="text-right">1ПМ</span>
        </div>
        <div className="flex flex-col gap-1.5">
          {(exercise.sets || []).map((set, index) => {
            const isRecord = records.has(`${exerciseId}:${index}`)
            return (
              <div key={index} className="grid grid-cols-[2rem_1fr_1fr_3.5rem] items-center gap-2 rounded-xl bg-card-2 px-2 py-2.5">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-card font-display text-[12px] font-700 text-ink-muted">{index + 1}</span>
                <span className="font-display text-[14px] font-700 text-ink">{formatWeight(set.weight)} кг</span>
                <span className="font-display text-[14px] font-700 text-ink">{set.reps}</span>
                <span className="text-right font-display text-[13px] font-700 text-ink-muted">{formatWeight(estimatedOneRepMax(set))}</span>
                {isRecord && (
                  <span className="col-span-4 flex items-center gap-1 text-[10px] font-700 uppercase tracking-wide text-accent">
                    <Trophy size={12} /> Личный рекорд
                  </span>
                )}
                {set.rpe ? <span className="col-span-4 text-[11px] font-600 text-ink-faint">RPE {set.rpe}</span> : null}
              </div>
            )
          })}
        </div>
      </div>
    </article>
  )
}
