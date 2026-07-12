import { useMemo } from "react"
import { Play, TrendingUp, Flame, AlertCircle } from "lucide-react"
import TopBar from "../components/TopBar.jsx"
import CalendarStrip from "../components/CalendarStrip.jsx"
import WorkoutRow from "../components/WorkoutRow.jsx"
import { InsetGroup } from "../components/InsetList.jsx"
import {
  trainingVolume,
  formatVolume,
  parseDate,
  daysBetween,
  formatFullDate,
  toISODate,
  countTrainingsInLastDays,
  completedWeekStreak,
} from "../lib/format.js"

const INACTIVITY_THRESHOLD_DAYS = 2

export default function OverviewPage({ history, loading, error, onRetry, onStart, onShowAll, onOpenWorkout }) {
  const workoutDates = useMemo(
    () => new Set(history.map((training) => parseDate(training.date)).filter(Boolean).map(toISODate)),
    [history],
  )
  const recentTrainingCount = useMemo(() => countTrainingsInLastDays(history, 15), [history])
  const weekStreak = useMemo(() => completedWeekStreak(history, 3), [history])
  const shouldGlow = useMemo(() => {
    if (loading) return false

    const now = new Date()
    const trainedToday = workoutDates.has(toISODate(now))
    const lastWorkoutDate = history
      .map((training) => parseDate(training.date))
      .filter(Boolean)
      .sort((a, b) => b.getTime() - a.getTime())[0]
    const inactiveForTooLong = lastWorkoutDate
      ? daysBetween(now, lastWorkoutDate) >= INACTIVITY_THRESHOLD_DAYS
      : true

    return !trainedToday || inactiveForTooLong
  }, [history, loading, workoutDates])

  const { weeklyTonnage, weeklyCount } = useMemo(() => {
    const now = new Date()
    let tonnage = 0
    let count = 0
    for (const t of history) {
      const d = parseDate(t.date)
      if (d && daysBetween(now, d) >= 0 && daysBetween(now, d) < 7) {
        tonnage += trainingVolume(t)
        count += 1
      }
    }
    return { weeklyTonnage: tonnage, weeklyCount: count }
  }, [history])

  const recent = history.slice(0, 3)
  const today = formatFullDate(new Date().toISOString().slice(0, 10))

  return (
    <>
      <TopBar />
      <div className="space-y-6 pt-5">
        <div className="px-4">
          <p className="text-[13px] font-500 text-ink-faint">{today}</p>
          <h1 className="mt-0.5 font-display text-[26px] font-800 leading-tight tracking-tight text-ink text-balance">
            Пора на тренировку?
          </h1>
        </div>

        {/* Calendar and stats */}
        {loading ? (
          <OverviewMetricsSkeleton />
        ) : (
          <div className="content-reveal flex flex-col gap-6">
            <section className="px-4">
              <div className="rounded-2xl border border-hairline bg-card p-4">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <h2 className="text-[13px] font-600 uppercase tracking-wide text-ink-faint">Последние 15 дней</h2>
                  <div className="flex shrink-0 flex-col items-end gap-0.5 text-right">
                    <span className="text-[13px] font-600 text-ink">Серия: {weekStreak} {weekLabel(weekStreak)}</span>
                    <span className="text-[12px] font-500 text-ink-muted">{recentTrainingCount} {trainingLabel(recentTrainingCount)}</span>
                  </div>
                </div>
                <CalendarStrip workoutDates={workoutDates} history={history} days={15} />
              </div>
            </section>
            <section className="grid grid-cols-2 gap-3 px-4">
              <StatCard icon={TrendingUp} label="Тоннаж за неделю" value={formatVolume(weeklyTonnage)} />
              <StatCard icon={Flame} label="На этой неделе" value={`${weeklyCount}`} unit={trainingLabel(weeklyCount)} />
            </section>
          </div>
        )}

        {/* Start workout */}
        <StartWorkoutButton onStart={onStart} shouldGlow={shouldGlow} />

        {/* Recent */}
        <div>
          <div className="flex items-center justify-between px-6 pb-2">
            <h2 className="font-display text-[17px] font-700 text-ink">Недавние тренировки</h2>
          </div>

          {loading ? (
            <SkeletonList />
          ) : error ? (
            <ErrorState message={error} onRetry={onRetry} />
          ) : recent.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="flex flex-col gap-3">
              <InsetGroup>
                {recent.map((t) => (
                  <WorkoutRow key={t.trainingId} training={t} compact onClick={() => onOpenWorkout?.(t)} />
                ))}
              </InsetGroup>
              <div className="px-4">
                <button
                  type="button"
                  onClick={onShowAll}
                  className="tap-feedback w-full rounded-xl py-2.5 text-[14px] font-600 text-accent active:bg-accent-soft"
                >
                  Показать всё
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

function russianPlural(number, forms) {
  const lastTwo = number % 100
  const last = number % 10
  if (lastTwo >= 11 && lastTwo <= 14) return forms[2]
  if (last === 1) return forms[0]
  if (last >= 2 && last <= 4) return forms[1]
  return forms[2]
}

function trainingLabel(number) {
  return russianPlural(number, ["тренировка", "тренировки", "тренировок"])
}

function weekLabel(number) {
  return russianPlural(number, ["неделя", "недели", "недель"])
}

function StartWorkoutButton({ onStart, shouldGlow }) {
  return (
    <div className="px-4">
      <button
        type="button"
        onClick={onStart}
        className={`tap-feedback flex w-full items-center justify-center gap-2 rounded-2xl bg-accent py-4 font-display text-[16px] font-700 text-surface shadow-lg shadow-accent/20 ${shouldGlow ? "workout-cta-glow" : ""}`}
      >
        <Play size={19} fill="currentColor" strokeWidth={0} />
        Начать тренировку
      </button>
    </div>
  )
}

function StatCard({ icon: Icon, label, value, unit }) {
  return (
    <div className="rounded-2xl border border-hairline bg-card p-4">
      <div className="flex items-center gap-2 text-ink-faint">
        <Icon size={16} className="text-accent" />
        <span className="text-[12px] font-500">{label}</span>
      </div>
      <div className="mt-3 flex items-baseline gap-1">
        <span className="font-display text-[28px] font-800 leading-none tracking-tight text-ink">{value}</span>
        <span className="text-[13px] font-500 text-ink-muted">{unit}</span>
      </div>
    </div>
  )
}

function OverviewMetricsSkeleton() {
  return (
    <div className="flex flex-col gap-6" aria-label="Загрузка показателей">
      <section className="px-4">
        <div className="rounded-2xl border border-hairline bg-card p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="skeleton-shimmer h-3.5 w-28 rounded" />
            <div className="flex flex-col items-end gap-2">
              <div className="skeleton-shimmer h-3.5 w-24 rounded" />
              <div className="skeleton-shimmer h-3 w-20 rounded" />
            </div>
          </div>
          <div className="mt-5 flex justify-between gap-2">
            {[0, 1, 2, 3, 4, 5, 6].map((day) => <div key={day} className="skeleton-shimmer h-9 w-9 rounded-full" />)}
          </div>
        </div>
      </section>
      <section className="grid grid-cols-2 gap-3 px-4">
        {[0, 1].map((card) => <div key={card} className="skeleton-shimmer h-28 rounded-2xl border border-hairline" />)}
      </section>
    </div>
  )
}

function SkeletonList() {
  return (
    <div className="px-4">
      <div className="overflow-hidden rounded-2xl border border-hairline bg-card">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-3.5">
            <div className="h-10 w-10 animate-pulse rounded-full bg-card-2" />
            <div className="flex-1 space-y-2">
              <div className="h-3.5 w-24 animate-pulse rounded bg-card-2" />
              <div className="h-3 w-40 animate-pulse rounded bg-card-2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="px-4">
      <div className="rounded-2xl border border-dashed border-hairline-strong bg-card/40 px-6 py-10 text-center">
        <p className="font-display text-[15px] font-600 text-ink">Тренировок пока нет</p>
        <p className="mt-1 text-[13px] text-ink-muted">Нажмите «Начать тренировку», чтобы добавить первую запись.</p>
      </div>
    </div>
  )
}

function ErrorState({ message, onRetry }) {
  return (
    <div className="px-4">
      <div className="flex flex-col items-center rounded-2xl border border-hairline bg-card px-6 py-8 text-center">
        <AlertCircle size={22} className="text-accent" />
        <p className="mt-2 text-[14px] font-500 text-ink">{message}</p>
        <button
          onClick={onRetry}
          className="mt-3 rounded-full bg-card-2 px-4 py-2 text-[13px] font-600 text-ink active:bg-hairline-strong"
        >
          Повторить
        </button>
      </div>
    </div>
  )
}
