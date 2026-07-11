import { useEffect, useMemo, useState } from "react"
import {
  AlertCircle,
  Check,
  Dumbbell,
  Flame,
  Layers,
  Ruler,
  Scale,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react"
import TopBar from "../components/TopBar.jsx"
import WorkoutRow from "../components/WorkoutRow.jsx"
import { InsetGroup } from "../components/InsetList.jsx"
import { trainingVolume, trainingSetCount, formatVolume } from "../lib/format.js"
import { EXERCISES } from "../lib/exercises.js"

const PERIODS = [
  { value: "all", label: "Всё время" },
  { value: "7", label: "7 дней" },
  { value: "30", label: "30 дней" },
  { value: "90", label: "90 дней" },
]

export default function ProfilePage({
  history,
  loading,
  error,
  onRetry,
  profile,
  profileLoading,
  onSaveProfile,
  onOpenWorkout,
}) {
  const [period, setPeriod] = useState("all")
  const [exerciseId, setExerciseId] = useState(null)
  const [sheet, setSheet] = useState(null)

  const stats = useMemo(() => {
    let volume = 0
    let sets = 0
    for (const training of history) {
      volume += trainingVolume(training)
      sets += trainingSetCount(training)
    }
    return { volume, sets, workouts: history.length }
  }, [history])

  const filteredHistory = useMemo(() => {
    const cutoff = period === "all" ? null : new Date(Date.now() - Number(period) * 86400000)
    return history.filter((training) => {
      const matchesPeriod = !cutoff || new Date(`${training.date}T23:59:59`) >= cutoff
      const matchesExercise =
        !exerciseId || training.exercises?.some((exercise) => exercise.baseExercise === exerciseId)
      return matchesPeriod && matchesExercise
    })
  }, [exerciseId, history, period])

  const selectedExercise = EXERCISES.find((exercise) => exercise.id === exerciseId)
  const displayName = profile.name?.trim() || "Алекс Картер"
  const initial = displayName.slice(0, 1).toUpperCase()

  return (
    <>
      <TopBar title="Профиль" />

      <div className="flex flex-col gap-6 pt-5">
        <section className="flex flex-col items-center px-4">
          <div className="flex h-20 w-20 items-center justify-center rounded-full border border-hairline-strong bg-card">
            <span className="font-display text-[28px] font-800 text-accent">{initial}</span>
          </div>
          <h1 className="mt-3 text-balance text-center font-display text-[20px] font-800 tracking-tight text-ink">
            {displayName}
          </h1>
          <p className="text-[13px] font-500 text-ink-muted">С нами с 2023 года</p>
        </section>

        <section className="grid grid-cols-3 gap-3 px-4" aria-label="Общая статистика">
          <StatTile icon={Layers} value={formatVolume(stats.volume)} unit="кг" label="Объём" />
          <StatTile icon={Dumbbell} value={stats.workouts} label="Тренировки" />
          <StatTile icon={Flame} value={stats.sets} label="Подходы" />
        </section>

        <section className="px-4" aria-labelledby="parameters-title">
          <div className="flex items-end justify-between px-2 pb-2">
            <div>
              <p className="text-[11px] font-600 uppercase tracking-[0.16em] text-ink-faint">Параметры</p>
              <h2 id="parameters-title" className="mt-1 font-display text-[17px] font-700 text-ink">
                Данные тела
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setSheet("profile")}
              className="min-h-11 rounded-full px-3 text-[13px] font-600 text-accent active:bg-accent-soft"
            >
              Изменить
            </button>
          </div>
          <button
            type="button"
            onClick={() => setSheet("profile")}
            className="grid w-full grid-cols-2 overflow-hidden rounded-2xl border border-hairline bg-card text-left active:bg-card-2"
            aria-label="Изменить рост и вес"
          >
            <Parameter icon={Ruler} label="Рост" value={profileLoading ? "—" : profile.height || "—"} unit="см" />
            <Parameter icon={Scale} label="Вес" value={profileLoading ? "—" : profile.weight || "—"} unit="кг" bordered />
          </button>
        </section>

        <section aria-labelledby="history-title">
          <div className="flex items-end justify-between px-6 pb-3">
            <div>
              <p className="text-[11px] font-600 uppercase tracking-[0.16em] text-ink-faint">Дневник</p>
              <h2 id="history-title" className="mt-1 font-display text-[17px] font-700 text-ink">
                История тренировок
              </h2>
            </div>
            {!loading && !error && <span className="text-[13px] font-500 text-ink-faint">{filteredHistory.length}</span>}
          </div>

          <div className="flex flex-col gap-2 px-4 pb-3">
            <div className="flex gap-1 rounded-2xl border border-hairline bg-card p-1" aria-label="Период истории">
              {PERIODS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setPeriod(option.value)}
                  aria-pressed={period === option.value}
                  className={`min-h-10 min-w-0 flex-1 rounded-xl px-1 text-[12px] font-600 transition-colors ${
                    period === option.value
                      ? "bg-accent text-surface"
                      : "text-ink-muted active:bg-card-2"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setSheet("exercise")}
              aria-pressed={Boolean(exerciseId)}
              className={`flex min-h-11 w-full items-center justify-between gap-3 rounded-2xl border px-4 text-[13px] font-600 ${
                exerciseId
                  ? "border-accent bg-accent-soft text-accent-strong"
                  : "border-hairline bg-card text-ink-muted active:bg-card-2"
              }`}
            >
              <span className="flex min-w-0 items-center gap-2">
                <SlidersHorizontal size={15} className="shrink-0" />
                <span className="truncate">{selectedExercise?.name || "Фильтр по упражнению"}</span>
              </span>
              <span className="shrink-0 text-[12px] font-500 text-ink-faint">Выбрать</span>
            </button>
          </div>

          {loading ? (
            <HistorySkeleton />
          ) : error ? (
            <div className="px-4">
              <div className="flex flex-col items-center rounded-2xl border border-hairline bg-card px-6 py-8 text-center">
                <AlertCircle size={22} className="text-accent" />
                <p className="mt-2 text-[14px] font-500 text-ink">{error}</p>
                <button type="button" onClick={onRetry} className="mt-3 min-h-11 rounded-full bg-card-2 px-4 text-[13px] font-600 text-ink active:bg-hairline-strong">
                  Попробовать снова
                </button>
              </div>
            </div>
          ) : filteredHistory.length === 0 ? (
            <div className="px-4">
              <div className="rounded-2xl border border-dashed border-hairline-strong bg-card/40 px-6 py-10 text-center">
                <p className="font-display text-[15px] font-600 text-ink">Ничего не найдено</p>
                <p className="mt-1 text-pretty text-[13px] leading-relaxed text-ink-muted">
                  Измените период или сбросьте фильтр по упражнению.
                </p>
                {(period !== "all" || exerciseId) && (
                  <button
                    type="button"
                    onClick={() => {
                      setPeriod("all")
                      setExerciseId(null)
                    }}
                    className="mt-4 min-h-11 rounded-full bg-card-2 px-4 text-[13px] font-600 text-ink"
                  >
                    Сбросить фильтры
                  </button>
                )}
              </div>
            </div>
          ) : (
            <InsetGroup>
              {filteredHistory.map((training) => (
                <WorkoutRow key={training.trainingId} training={training} onClick={() => onOpenWorkout?.(training)} />
              ))}
            </InsetGroup>
          )}
        </section>
      </div>

      {sheet === "profile" && (
        <ProfileEditor profile={profile} onClose={() => setSheet(null)} onSave={onSaveProfile} />
      )}
      {sheet === "exercise" && (
        <ExerciseFilter
          selected={exerciseId}
          onSelect={(id) => {
            setExerciseId(id)
            setSheet(null)
          }}
          onClose={() => setSheet(null)}
        />
      )}
    </>
  )
}

function Parameter({ icon: Icon, label, value, unit, bordered = false }) {
  return (
    <span className={`flex items-center gap-3 p-4 ${bordered ? "border-l border-hairline" : ""}`}>
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent">
        <Icon size={19} />
      </span>
      <span className="min-w-0">
        <span className="block text-[12px] font-500 text-ink-muted">{label}</span>
        <span className="font-display text-[20px] font-800 text-ink">
          {value} <span className="text-[12px] font-500 text-ink-faint">{unit}</span>
        </span>
      </span>
    </span>
  )
}

function StatTile({ icon: Icon, value, unit, label }) {
  return (
    <div className="rounded-2xl border border-hairline bg-card px-3 py-4 text-center">
      <Icon size={18} className="mx-auto text-accent" />
      <div className="mt-2 flex items-baseline justify-center gap-1">
        <span className="font-display text-[22px] font-800 leading-none text-ink">{value}</span>
        {unit && <span className="text-[12px] font-500 text-ink-muted">{unit}</span>}
      </div>
      <p className="mt-1 text-[10px] font-600 uppercase tracking-wide text-ink-faint">{label}</p>
    </div>
  )
}

function HistorySkeleton() {
  return (
    <div className="px-4">
      <div className="overflow-hidden rounded-2xl border border-hairline bg-card">
        {[0, 1, 2, 3].map((item) => (
          <div key={item} className="flex items-center gap-3 px-4 py-3.5">
            <div className="h-10 w-10 animate-pulse rounded-full bg-card-2" />
            <div className="flex-1">
              <div className="flex flex-col gap-2">
                <div className="h-3.5 w-24 animate-pulse rounded bg-card-2" />
                <div className="h-3 w-40 animate-pulse rounded bg-card-2" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function Sheet({ title, onClose, children }) {
  useEffect(() => {
    const closeOnEscape = (event) => event.key === "Escape" && onClose()
    document.addEventListener("keydown", closeOnEscape)
    return () => document.removeEventListener("keydown", closeOnEscape)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-surface/80 backdrop-blur-sm animate-fade" role="presentation" onMouseDown={onClose}>
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="sheet-title"
        className="animate-sheet max-h-[82vh] w-full max-w-md overflow-hidden rounded-t-2xl border border-hairline-strong bg-surface-2"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-hairline-strong" />
        <header className="flex items-center justify-between px-5 py-4">
          <h2 id="sheet-title" className="font-display text-[18px] font-700 text-ink">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Закрыть" className="flex h-11 w-11 items-center justify-center rounded-full bg-card text-ink-muted active:bg-card-2">
            <X size={20} />
          </button>
        </header>
        {children}
      </section>
    </div>
  )
}

function ProfileEditor({ profile, onClose, onSave }) {
  const [height, setHeight] = useState(profile.height || "")
  const [weight, setWeight] = useState(profile.weight || "")
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState("")

  const valid = Number(height) >= 100 && Number(height) <= 250 && Number(weight) >= 30 && Number(weight) <= 300

  async function submit(event) {
    event.preventDefault()
    if (!valid || saving) return
    setSaving(true)
    setMessage("")
    try {
      await onSave({ ...profile, height: Number(height), weight: Number(weight) })
      onClose()
    } catch (err) {
      setMessage(err.message || "Не удалось сохранить данные")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Sheet title="Данные тела" onClose={onClose}>
      <form onSubmit={submit} className="flex flex-col gap-5 px-5 pb-8">
        <p className="text-pretty text-[14px] leading-relaxed text-ink-muted">
          Эти параметры помогают точнее отслеживать прогресс и тренировочный объём.
        </p>
        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-2 text-[13px] font-600 text-ink-muted">
            Рост, см
            <input
              type="number"
              inputMode="numeric"
              min="100"
              max="250"
              value={height}
              onChange={(event) => setHeight(event.target.value)}
              className="h-14 rounded-2xl border border-hairline-strong bg-card px-4 font-display text-[20px] font-700 text-ink outline-none focus:border-accent"
              placeholder="180"
              autoFocus
            />
          </label>
          <label className="flex flex-col gap-2 text-[13px] font-600 text-ink-muted">
            Вес, кг
            <input
              type="number"
              inputMode="decimal"
              min="30"
              max="300"
              step="0.1"
              value={weight}
              onChange={(event) => setWeight(event.target.value)}
              className="h-14 rounded-2xl border border-hairline-strong bg-card px-4 font-display text-[20px] font-700 text-ink outline-none focus:border-accent"
              placeholder="78"
            />
          </label>
        </div>
        {message && <p role="alert" className="text-[13px] font-500 text-accent-strong">{message}</p>}
        <button
          type="submit"
          disabled={!valid || saving}
          className="min-h-14 rounded-2xl bg-accent px-5 text-[15px] font-700 text-surface disabled:cursor-not-allowed disabled:opacity-40"
        >
          {saving ? "Сохраняем…" : "Сохранить"}
        </button>
      </form>
    </Sheet>
  )
}

function ExerciseFilter({ selected, onSelect, onClose }) {
  const [query, setQuery] = useState("")
  const exercises = EXERCISES.filter((exercise) => exercise.name.toLowerCase().includes(query.trim().toLowerCase()))

  return (
    <Sheet title="Фильтр по упражнению" onClose={onClose}>
      <div className="px-5 pb-3">
        <label className="flex h-12 items-center gap-3 rounded-2xl border border-hairline-strong bg-card px-4 focus-within:border-accent">
          <Search size={18} className="text-ink-faint" />
          <span className="sr-only">Найти упражнение</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Найти упражнение"
            className="min-w-0 flex-1 bg-transparent text-[15px] text-ink outline-none placeholder:text-ink-faint"
            autoFocus
          />
        </label>
      </div>
      <div className="max-h-[58vh] overflow-y-auto px-3 pb-8">
        <button type="button" onClick={() => onSelect(null)} className="flex min-h-12 w-full items-center justify-between rounded-xl px-3 text-left text-[14px] font-600 text-ink active:bg-card">
          Все упражнения
          {!selected && <Check size={18} className="text-accent" />}
        </button>
        {exercises.map((exercise) => (
          <button
            key={exercise.id}
            type="button"
            onClick={() => onSelect(exercise.id)}
            className="flex min-h-12 w-full items-center justify-between gap-3 rounded-xl px-3 text-left text-[14px] font-500 text-ink active:bg-card"
          >
            <span className="min-w-0 truncate">{exercise.name}</span>
            {selected === exercise.id && <Check size={18} className="shrink-0 text-accent" />}
          </button>
        ))}
        {exercises.length === 0 && <p className="px-3 py-8 text-center text-[14px] text-ink-muted">Упражнение не найдено</p>}
      </div>
    </Sheet>
  )
}
