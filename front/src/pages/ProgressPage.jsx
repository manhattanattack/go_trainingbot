import { useEffect, useMemo, useState } from "react"
import { AlertCircle, Check, ChevronDown, Search, TrendingUp, X } from "lucide-react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import TopBar from "../components/TopBar.jsx"
import { getExercise, MUSCLE_GROUPS } from "../lib/exercises.js"
import {
  exerciseProgress,
  formatFullDate,
  formatVolume,
  formatWeight,
  monthlyProgress,
  muscleGroupVolume,
  progressExerciseIds,
} from "../lib/format.js"

export default function ProgressPage({ history, loading, error, onRetry }) {
  const exerciseIds = useMemo(() => progressExerciseIds(history), [history])
  const [exerciseId, setExerciseId] = useState(null)
  const [sheetOpen, setSheetOpen] = useState(false)

  useEffect(() => {
    if (!exerciseIds.length) setExerciseId(null)
    else if (!exerciseId || !exerciseIds.includes(exerciseId)) setExerciseId(exerciseIds[0])
  }, [exerciseId, exerciseIds])

  const points = useMemo(() => exerciseProgress(history, exerciseId), [exerciseId, history])
  const latest = points.at(-1)
  const monthly = monthlyProgress(points)
  const exercise = exerciseId ? getExercise(exerciseId) : null

  return (
    <>
      <TopBar title="Прогресс" />
      <div className="flex flex-col gap-5 px-4 pb-6 pt-5">
        <header>
          <p className="text-[11px] font-600 uppercase tracking-[0.16em] text-ink-faint">Аналитика силы</p>
          <h1 className="mt-1 text-balance font-display text-[26px] font-800 tracking-tight text-ink">
            Динамика нагрузок
          </h1>
          <p className="mt-1 max-w-sm text-pretty text-[13px] leading-relaxed text-ink-muted">
            Сравнивайте рабочий вес и расчётный максимум по каждой тренировке.
          </p>
        </header>

        {loading ? (
          <ProgressSkeleton />
        ) : error ? (
          <StateCard icon={AlertCircle} title="Не удалось загрузить прогресс" text={error}>
            <button type="button" onClick={onRetry} className="min-h-11 rounded-full bg-card-2 px-4 text-[13px] font-600 text-ink">
              Попробовать снова
            </button>
          </StateCard>
        ) : !exerciseIds.length ? (
          <StateCard icon={TrendingUp} title="Пока мало данных" text="Добавьте хотя бы два подхода одного упражнения, чтобы начать отслеживать прогресс." />
        ) : (
          <>
            <button
              type="button"
              onClick={() => setSheetOpen(true)}
              className="flex min-h-14 w-full items-center justify-between gap-4 rounded-2xl border border-hairline-strong bg-card px-4 text-left active:bg-card-2"
              aria-haspopup="dialog"
            >
              <span className="min-w-0">
                <span className="block text-[11px] font-600 uppercase tracking-[0.12em] text-ink-faint">Упражнение</span>
                <span className="mt-0.5 block truncate font-display text-[15px] font-700 text-ink">{exercise?.name}</span>
              </span>
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent">
                <ChevronDown size={18} />
              </span>
            </button>

            <section className="overflow-hidden rounded-2xl border border-hairline bg-card" aria-labelledby="chart-title">
              <div className="flex flex-col gap-3 border-b border-hairline px-4 py-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-600 uppercase tracking-[0.14em] text-ink-faint">История</p>
                    <h2 id="chart-title" className="mt-1 font-display text-[17px] font-700 text-ink">Вес по тренировкам</h2>
                  </div>
                  <span className="rounded-full bg-card-2 px-2.5 py-1 text-[11px] font-600 text-ink-muted">{points.length} точек</span>
                </div>
                <div className="flex flex-wrap gap-4 text-[11px] font-500 text-ink-muted" aria-label="Легенда графика">
                  <Legend color="bg-accent" label="Рабочий вес" />
                  <Legend color="bg-ink-muted" label="Расчётный 1ПМ" dashed />
                </div>
              </div>

              {points.length < 2 ? (
                <div className="flex min-h-64 flex-col items-center justify-center px-8 text-center">
                  <TrendingUp size={24} className="text-accent" />
                  <p className="mt-3 font-display text-[15px] font-700 text-ink">Нужна ещё одна тренировка</p>
                  <p className="mt-1 text-pretty text-[13px] leading-relaxed text-ink-muted">После следующей записи здесь появится линия динамики.</p>
                </div>
              ) : (
                <div className="h-72 w-full px-1 pb-2 pt-4" aria-label={`График прогресса: ${exercise?.name}`}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={points} margin={{ top: 8, right: 14, left: 2, bottom: 2 }}>
                      <CartesianGrid stroke="var(--color-hairline)" vertical={false} />
                      <XAxis dataKey="shortDate" axisLine={false} tickLine={false} tick={{ fill: "var(--color-ink-faint)", fontSize: 11 }} dy={8} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: "var(--color-ink-faint)", fontSize: 11 }} width={48} tickFormatter={(value) => `${formatWeight(value)} кг`} />
                      <Tooltip content={<ProgressTooltip />} cursor={{ stroke: "var(--color-hairline-strong)", strokeDasharray: "4 4" }} />
                      <Line type="monotone" dataKey="maxWeight" stroke="var(--color-accent)" strokeWidth={3} dot={{ r: 4, fill: "var(--color-card)", strokeWidth: 2 }} activeDot={{ r: 6 }} />
                      <Line type="monotone" dataKey="estimatedOneRepMax" stroke="var(--color-ink-muted)" strokeWidth={2} strokeDasharray="6 5" dot={{ r: 3, fill: "var(--color-card)", strokeWidth: 2 }} activeDot={{ r: 5 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </section>

            <section className="grid grid-cols-3 gap-2" aria-label="Текущие показатели">
              <Metric label="Рабочий вес" value={latest ? formatWeight(latest.maxWeight) : "—"} unit="кг" />
              <Metric label="Расчётный 1ПМ" value={latest ? formatWeight(latest.estimatedOneRepMax) : "—"} unit="кг" />
              <Metric
                label="За 30 дней"
                value={monthly ? `${monthly.change > 0 ? "+" : ""}${formatWeight(monthly.change)}` : "—"}
                unit={monthly ? `кг · ${monthly.percent === null ? "—" : `${monthly.percent > 0 ? "+" : ""}${formatWeight(monthly.percent)}%`}` : "нет базы"}
                positive={monthly?.change > 0}
              />
            </section>
          </>
        )}

        {!loading && !error && <MuscleVolumeSection history={history} />}
      </div>

      {sheetOpen && (
        <ExerciseSheet
          exerciseIds={exerciseIds}
          selected={exerciseId}
          onClose={() => setSheetOpen(false)}
          onSelect={(id) => {
            setExerciseId(id)
            setSheetOpen(false)
          }}
        />
      )}
    </>
  )
}

const VOLUME_PERIODS = [
  { id: "week", label: "Неделя" },
  { id: "month", label: "Месяц" },
  { id: "quarter", label: "3 месяца" },
]

const BAR_OPACITY = [1, 0.86, 0.72, 0.9, 0.78, 0.64]

function MuscleVolumeSection({ history }) {
  const [period, setPeriod] = useState("week")
  const data = useMemo(() => muscleGroupVolume(history, MUSCLE_GROUPS, period), [history, period])
  const hasVolume = data.some((group) => group.volume > 0)

  return (
    <section className="overflow-hidden rounded-2xl border border-hairline bg-card" aria-labelledby="muscle-volume-title">
      <div className="flex flex-col gap-4 border-b border-hairline px-4 py-4">
        <div>
          <p className="text-[11px] font-600 uppercase tracking-[0.14em] text-ink-faint">Распределение нагрузки</p>
          <h2 id="muscle-volume-title" className="mt-1 font-display text-[17px] font-700 text-ink">Объём по группам мышц</h2>
        </div>
        <div className="flex gap-1 rounded-2xl border border-hairline bg-card p-1" role="group" aria-label="Период аналитики">
          {VOLUME_PERIODS.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => setPeriod(option.id)}
              aria-pressed={period === option.id}
              className={`min-h-10 min-w-0 flex-1 rounded-xl px-1 text-[12px] font-600 transition-colors ${
                period === option.id ? "bg-accent text-surface" : "text-ink-muted active:bg-card-2"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-2 pb-2 pt-4">
        <div className="h-64 w-full" aria-label="Столбчатая диаграмма объёма по группам мышц">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 2 }}>
              <CartesianGrid stroke="var(--color-hairline)" vertical={false} />
              <XAxis dataKey="shortLabel" axisLine={false} tickLine={false} interval={0} tick={{ fill: "var(--color-ink-faint)", fontSize: 10 }} dy={8} />
              <YAxis axisLine={false} tickLine={false} width={42} tick={{ fill: "var(--color-ink-faint)", fontSize: 10 }} tickFormatter={formatVolume} />
              <Tooltip content={<VolumeTooltip />} cursor={{ fill: "var(--color-surface)", opacity: 0.65 }} />
              <Bar dataKey="volume" fill="var(--color-accent)" radius={[6, 6, 2, 2]} minPointSize={2}>
                {data.map((group, index) => <Cell key={group.id} fill="var(--color-accent)" fillOpacity={BAR_OPACITY[index]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        {!hasVolume && <p className="px-4 pb-4 text-center text-[12px] leading-relaxed text-ink-muted">За этот период объём не зафиксирован.</p>}
      </div>

      <div className="border-t border-hairline px-4 py-4">
        <p className="text-[11px] font-600 uppercase tracking-[0.12em] text-ink-faint">Средняя частота</p>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {data.map((group) => (
            <div key={group.id} className="flex items-center justify-between gap-2 rounded-xl bg-surface px-3 py-2.5">
              <span className="text-[12px] font-500 text-ink-muted">{group.label}</span>
              <span className="whitespace-nowrap font-display text-[12px] font-700 text-ink">{formatWeight(group.frequency)} раз/нед</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function VolumeTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const group = payload[0].payload
  return (
    <div className="rounded-xl border border-hairline-strong bg-surface-2 p-3 shadow-xl">
      <p className="text-[11px] font-600 text-ink-faint">{group.label}</p>
      <p className="mt-1 font-display text-[14px] font-700 text-accent">{formatWeight(group.volume)} кг</p>
      <p className="mt-1 text-[11px] text-ink-muted">{formatWeight(group.frequency)} раз/нед</p>
    </div>
  )
}

function Legend({ color, label, dashed }) {
  return <span className="flex items-center gap-2"><span className={`h-0.5 w-5 ${color} ${dashed ? "opacity-70" : ""}`} />{label}</span>
}

function Metric({ label, value, unit, positive }) {
  return (
    <div className="min-w-0 rounded-2xl border border-hairline bg-card px-3 py-4">
      <p className="min-h-8 text-[10px] font-600 uppercase leading-4 tracking-wide text-ink-faint">{label}</p>
      <p className={`mt-2 truncate font-display text-[21px] font-800 leading-none ${positive ? "text-positive" : "text-ink"}`}>{value}</p>
      <p className={`mt-1 truncate text-[10px] font-500 ${positive ? "text-positive" : "text-ink-muted"}`}>{unit}</p>
    </div>
  )
}

function ProgressTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const point = payload[0].payload
  return (
    <div className="min-w-40 rounded-xl border border-hairline-strong bg-surface-2 p-3 shadow-xl">
      <p className="text-[11px] font-600 text-ink-faint">{formatFullDate(point.date)}</p>
      <p className="mt-2 text-[12px] font-600 text-accent">Рабочий: {formatWeight(point.maxWeight)} кг</p>
      <p className="mt-1 text-[12px] font-500 text-ink-muted">1ПМ: {formatWeight(point.estimatedOneRepMax)} кг</p>
    </div>
  )
}

function StateCard({ icon: Icon, title, text, children }) {
  return (
    <div className="flex min-h-72 flex-col items-center justify-center rounded-2xl border border-hairline bg-card px-8 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-soft text-accent"><Icon size={22} /></span>
      <h2 className="mt-4 font-display text-[17px] font-700 text-ink">{title}</h2>
      <p className="mt-2 text-pretty text-[13px] leading-relaxed text-ink-muted">{text}</p>
      {children && <div className="mt-4">{children}</div>}
    </div>
  )
}

function ProgressSkeleton() {
  return (
    <div className="flex flex-col gap-4" aria-label="Загрузка прогресса">
      <div className="h-14 animate-pulse rounded-2xl bg-card" />
      <div className="h-96 animate-pulse rounded-2xl bg-card" />
      <div className="grid grid-cols-3 gap-2">{[0, 1, 2].map((item) => <div key={item} className="h-28 animate-pulse rounded-2xl bg-card" />)}</div>
    </div>
  )
}

function ExerciseSheet({ exerciseIds, selected, onSelect, onClose }) {
  const [query, setQuery] = useState("")
  const options = exerciseIds.map(getExercise).filter((exercise) => exercise.name.toLowerCase().includes(query.trim().toLowerCase()))

  useEffect(() => {
    const closeOnEscape = (event) => event.key === "Escape" && onClose()
    document.addEventListener("keydown", closeOnEscape)
    return () => document.removeEventListener("keydown", closeOnEscape)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-surface/80 backdrop-blur-sm animate-fade" role="presentation" onMouseDown={onClose}>
      <section role="dialog" aria-modal="true" aria-labelledby="exercise-sheet-title" className="animate-sheet max-h-[82vh] w-full max-w-md overflow-hidden rounded-t-2xl border border-hairline-strong bg-surface-2" onMouseDown={(event) => event.stopPropagation()}>
        <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-hairline-strong" />
        <header className="flex items-center justify-between px-5 py-4">
          <h2 id="exercise-sheet-title" className="font-display text-[18px] font-700 text-ink">Выб��рите упражнение</h2>
          <button type="button" onClick={onClose} aria-label="Закрыть" className="flex h-11 w-11 items-center justify-center rounded-full bg-card text-ink-muted active:bg-card-2"><X size={20} /></button>
        </header>
        <div className="px-5 pb-3">
          <label className="flex h-12 items-center gap-3 rounded-2xl border border-hairline-strong bg-card px-4 focus-within:border-accent">
            <Search size={18} className="text-ink-faint" />
            <span className="sr-only">Найти упражнение</span>
            <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Найти упражнение" className="min-w-0 flex-1 bg-transparent text-[15px] text-ink outline-none placeholder:text-ink-faint" autoFocus />
          </label>
        </div>
        <div className="max-h-[58vh] overflow-y-auto px-3 pb-8">
          {options.map((exercise) => (
            <button key={exercise.id} type="button" onClick={() => onSelect(exercise.id)} className="flex min-h-14 w-full items-center justify-between gap-3 rounded-xl px-3 text-left active:bg-card">
              <span className="min-w-0"><span className="block truncate text-[14px] font-600 text-ink">{exercise.name}</span><span className="mt-0.5 block text-[11px] text-ink-faint">{exercise.group}</span></span>
              {selected === exercise.id && <Check size={18} className="shrink-0 text-accent" />}
            </button>
          ))}
          {!options.length && <p className="px-3 py-10 text-center text-[14px] text-ink-muted">Упражнение не найдено</p>}
        </div>
      </section>
    </div>
  )
}
