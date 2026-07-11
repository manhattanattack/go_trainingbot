import { useEffect, useMemo, useRef, useState } from "react"
import { AlertCircle, Check, ChevronDown, Dumbbell, Search, TrendingUp, X } from "lucide-react"
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
  tonnageProgress,
} from "../lib/format.js"

const TABS = [
  { id: "strength", label: "Сила" },
  { id: "volume", label: "Объём" },
  { id: "tonnage", label: "Тоннаж" },
]

const PERIODS = [
  { id: "week", label: "Неделя" },
  { id: "month", label: "Месяц" },
  { id: "quarter", label: "3 месяца" },
]

const BAR_OPACITY = [1, 0.86, 0.72, 0.9, 0.78, 0.64]

export default function ProgressPage({ history, loading, error, onRetry }) {
  const [tab, setTab] = useState("strength")
  const [period, setPeriod] = useState("week")

  return (
    <>
      <TopBar title="Прогресс" />
      <main className="flex flex-col gap-5 px-4 pb-6 pt-5">
        <header>
          <p className="text-[11px] font-600 uppercase tracking-[0.16em] text-ink-faint">Аналитика тренировок</p>
          <h1 className="mt-1 text-balance font-display text-[26px] font-800 tracking-tight text-ink">Ваш прогресс</h1>
          <p className="mt-1 max-w-sm text-pretty text-[13px] leading-relaxed text-ink-muted">
            Следите за силой, балансом мышечных групп и общей выполненной работой.
          </p>
        </header>

        <TabControl value={tab} onChange={setTab} />

        {loading ? (
          <ProgressSkeleton />
        ) : error ? (
          <StateCard icon={AlertCircle} title="Не удалось загрузить прогресс" text={error}>
            <button type="button" onClick={onRetry} className="tap-feedback min-h-11 rounded-full bg-card-2 px-4 text-[13px] font-600 text-ink">Попробовать снова</button>
          </StateCard>
        ) : (
          <div key={tab} className="content-reveal">
            {tab === "strength" ? (
              <StrengthSection history={history} />
            ) : tab === "volume" ? (
              <MuscleVolumeSection history={history} period={period} onPeriodChange={setPeriod} />
            ) : (
              <TonnageSection history={history} period={period} onPeriodChange={setPeriod} />
            )}
          </div>
        )}
      </main>
    </>
  )
}

function TabControl({ value, onChange }) {
  return (
    <div className="flex gap-1 rounded-2xl border border-hairline bg-card p-1" role="tablist" aria-label="Раздел прогресса">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={value === tab.id}
          onClick={() => onChange(tab.id)}
          className={`min-h-11 flex-1 rounded-xl px-2 text-[13px] font-700 transition-colors ${value === tab.id ? "bg-accent text-surface" : "text-ink-muted active:bg-card-2"}`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}

function PeriodControl({ value, onChange }) {
  return (
    <div className="flex gap-1 rounded-2xl border border-hairline bg-surface p-1" role="group" aria-label="Период аналитики">
      {PERIODS.map((option) => (
        <button
          key={option.id}
          type="button"
          onClick={() => onChange(option.id)}
          aria-pressed={value === option.id}
          className={`min-h-10 min-w-0 flex-1 rounded-xl px-1 text-[12px] font-600 transition-colors ${value === option.id ? "bg-card-2 text-ink" : "text-ink-muted active:bg-card"}`}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}

function StrengthSection({ history }) {
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

  if (!exerciseIds.length) {
    return <StateCard icon={TrendingUp} title="Пока мало данных" text="Добавьте хотя бы два подхода одного упражнения, чтобы начать отслеживать прогресс." />
  }

  return (
    <>
      <section className="flex flex-col gap-4" aria-label="Аналитика силы">
        <button type="button" onClick={() => setSheetOpen(true)} className="flex min-h-14 w-full items-center justify-between gap-4 rounded-2xl border border-hairline-strong bg-card px-4 text-left active:bg-card-2" aria-haspopup="dialog">
          <span className="min-w-0">
            <span className="block text-[11px] font-600 uppercase tracking-[0.12em] text-ink-faint">Упражнение</span>
            <span className="mt-0.5 block truncate font-display text-[15px] font-700 text-ink">{exercise?.name}</span>
          </span>
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent"><ChevronDown size={18} /></span>
        </button>

        <section className="overflow-hidden rounded-2xl border border-hairline bg-card" aria-labelledby="strength-chart-title">
          <ChartHeader eyebrow="История" title="Вес по тренировкам" titleId="strength-chart-title" badge={`${points.length} точек`}>
            <div className="flex flex-wrap gap-4 text-[11px] font-500 text-ink-muted" aria-label="Легенда графика">
              <Legend color="bg-accent" label="Рабочий вес" />
              <Legend color="bg-ink-muted" label="Расчётный 1ПМ" dashed />
            </div>
          </ChartHeader>
          {points.length < 2 ? (
            <InlineEmpty icon={TrendingUp} title="Нужна ещё одна тренировка" text="После следующей записи здесь появится линия динамики." />
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
          <Metric label="За 30 дней" value={monthly ? `${monthly.change > 0 ? "+" : ""}${formatWeight(monthly.change)}` : "—"} unit={monthly ? `кг · ${monthly.percent === null ? "—" : `${monthly.percent > 0 ? "+" : ""}${formatWeight(monthly.percent)}%`}` : "нет базы"} positive={monthly?.change > 0} />
        </section>
      </section>

      {sheetOpen && <ExerciseSheet exerciseIds={exerciseIds} selected={exerciseId} onClose={() => setSheetOpen(false)} onSelect={(id) => { setExerciseId(id); setSheetOpen(false) }} />}
    </>
  )
}

function MuscleVolumeSection({ history, period, onPeriodChange }) {
  const data = useMemo(() => muscleGroupVolume(history, MUSCLE_GROUPS, period), [history, period])
  const hasVolume = data.some((group) => group.volume > 0)

  return (
    <section className="overflow-hidden rounded-2xl border border-hairline bg-card" aria-labelledby="muscle-volume-title">
      <ChartHeader eyebrow="Распределение нагрузки" title="Объём по группам мышц" titleId="muscle-volume-title">
        <PeriodControl value={period} onChange={onPeriodChange} />
      </ChartHeader>
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

function TonnageSection({ history, period, onPeriodChange }) {
  const data = useMemo(() => tonnageProgress(history, period), [history, period])

  return (
    <section className="flex flex-col gap-3" aria-label="Аналитика тоннажа">
      <section className="overflow-hidden rounded-2xl border border-hairline bg-card" aria-labelledby="tonnage-title">
        <ChartHeader eyebrow="Выполненная работа" title="Динамика тоннажа" titleId="tonnage-title">
          <PeriodControl value={period} onChange={onPeriodChange} />
        </ChartHeader>
        {data.trainingCount < 2 ? (
          <InlineEmpty icon={Dumbbell} title="Нужно больше тренировок" text="Запишите хотя бы две тренировки за выбранный период, чтобы увидеть динамику тоннажа." />
        ) : (
          <div className="h-72 w-full px-2 pb-2 pt-4" aria-label="Столбчатая диаграмма тоннажа">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.points} margin={{ top: 8, right: 8, left: 0, bottom: 2 }}>
                <CartesianGrid stroke="var(--color-hairline)" vertical={false} />
                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: "var(--color-ink-faint)", fontSize: 10 }} dy={8} />
                <YAxis axisLine={false} tickLine={false} width={46} tick={{ fill: "var(--color-ink-faint)", fontSize: 10 }} tickFormatter={formatVolume} />
                <Tooltip content={<TonnageTooltip />} cursor={{ fill: "var(--color-surface)", opacity: 0.65 }} />
                <Bar dataKey="tonnage" fill="var(--color-accent)" radius={[7, 7, 2, 2]} minPointSize={3} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>
      <section className="grid grid-cols-3 gap-2" aria-label="Показатели тоннажа">
        <Metric label="Всего" value={formatVolume(data.total)} unit="кг" />
        <Metric label="За тренировку" value={formatVolume(data.average)} unit="кг в среднем" />
        <Metric label="К прошлому" value={data.change === null ? "—" : `${data.change > 0 ? "+" : ""}${formatWeight(data.change)}%`} unit={data.change === null ? "нет базы" : "за период"} positive={data.change > 0} />
      </section>
    </section>
  )
}

function ChartHeader({ eyebrow, title, titleId, badge, children }) {
  return (
    <div className="flex flex-col gap-4 border-b border-hairline px-4 py-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-600 uppercase tracking-[0.14em] text-ink-faint">{eyebrow}</p>
          <h2 id={titleId} className="mt-1 font-display text-[17px] font-700 text-ink">{title}</h2>
        </div>
        {badge && <span className="rounded-full bg-card-2 px-2.5 py-1 text-[11px] font-600 text-ink-muted">{badge}</span>}
      </div>
      {children}
    </div>
  )
}

function InlineEmpty({ icon: Icon, title, text }) {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center px-8 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-soft text-accent"><Icon size={22} /></span>
      <p className="mt-3 font-display text-[15px] font-700 text-ink">{title}</p>
      <p className="mt-1 text-pretty text-[13px] leading-relaxed text-ink-muted">{text}</p>
    </div>
  )
}

function VolumeTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const group = payload[0].payload
  return <TooltipCard title={group.label} value={`${formatWeight(group.volume)} кг`} detail={`${formatWeight(group.frequency)} раз/нед`} />
}

function TonnageTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const point = payload[0].payload
  return <TooltipCard title={formatFullDate(point.date)} value={`${formatWeight(point.tonnage)} кг`} detail={`${point.trainings} трен.`} />
}

function TooltipCard({ title, value, detail }) {
  return (
    <div className="rounded-xl border border-hairline-strong bg-surface-2 p-3 shadow-xl">
      <p className="text-[11px] font-600 text-ink-faint">{title}</p>
      <p className="mt-1 font-display text-[14px] font-700 text-accent">{value}</p>
      <p className="mt-1 text-[11px] text-ink-muted">{detail}</p>
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
      <div className="skeleton-shimmer h-14 rounded-2xl border border-hairline" />
      <div className="overflow-hidden rounded-2xl border border-hairline bg-card p-4">
        <div className="skeleton-shimmer h-3 w-24 rounded" />
        <div className="skeleton-shimmer mt-2 h-5 w-40 rounded" />
        <div className="mt-8 flex h-64 items-end gap-3">
          {[42, 68, 54, 82, 64, 92].map((height, item) => <div key={item} className="skeleton-shimmer flex-1 rounded-t-lg" style={{ height: `${height}%` }} />)}
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2">{[0, 1, 2].map((item) => <div key={item} className="skeleton-shimmer h-28 rounded-2xl border border-hairline" />)}</div>
    </div>
  )
}

function ExerciseSheet({ exerciseIds, selected, onSelect, onClose }) {
  const [query, setQuery] = useState("")
  const [closing, setClosing] = useState(false)
  const closeTimerRef = useRef(null)
  const options = exerciseIds.map(getExercise).filter((exercise) => exercise.name.toLowerCase().includes(query.trim().toLowerCase()))

  const requestClose = (afterClose = onClose) => {
    if (closing) return
    setClosing(true)
    closeTimerRef.current = setTimeout(afterClose, 240)
  }

  useEffect(() => {
    const closeOnEscape = (event) => event.key === "Escape" && requestClose()
    document.addEventListener("keydown", closeOnEscape)
    return () => document.removeEventListener("keydown", closeOnEscape)
  }, [closing])

  useEffect(() => () => clearTimeout(closeTimerRef.current), [])

  return (
    <div className={`fixed inset-0 z-50 flex items-end justify-center bg-surface/80 backdrop-blur-sm animate-fade ${closing ? "sheet-closing" : ""}`} role="presentation" onMouseDown={() => requestClose()}>
      <section role="dialog" aria-modal="true" aria-labelledby="exercise-sheet-title" className="animate-sheet max-h-[82vh] w-full max-w-md overflow-hidden rounded-t-2xl border border-hairline-strong bg-surface-2" onMouseDown={(event) => event.stopPropagation()}>
        <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-hairline-strong" />
        <header className="flex items-center justify-between px-5 py-4">
          <h2 id="exercise-sheet-title" className="font-display text-[18px] font-700 text-ink">Выберите упражнение</h2>
          <button type="button" onClick={() => requestClose()} aria-label="Закрыть" className="flex h-11 w-11 items-center justify-center rounded-full bg-card text-ink-muted active:bg-card-2"><X size={20} /></button>
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
            <button key={exercise.id} type="button" onClick={() => requestClose(() => onSelect(exercise.id))} className="flex min-h-14 w-full items-center justify-between gap-3 rounded-xl px-3 text-left active:bg-card">
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
