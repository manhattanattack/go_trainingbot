import { useMemo } from "react"
import { Play, TrendingUp, Flame, AlertCircle } from "lucide-react"
import TopBar from "../components/TopBar.jsx"
import CalendarStrip from "../components/CalendarStrip.jsx"
import WorkoutRow from "../components/WorkoutRow.jsx"
import { InsetGroup } from "../components/InsetList.jsx"
import { trainingVolume, formatVolume, parseDate, daysBetween, formatFullDate } from "../lib/format.js"

export default function OverviewPage({ history, loading, error, onRetry, onStart }) {
  const workoutDates = useMemo(() => new Set(history.map((t) => t.date)), [history])

  const { weeklyVolume, weeklyCount } = useMemo(() => {
    const now = new Date()
    let vol = 0
    let count = 0
    for (const t of history) {
      const d = parseDate(t.date)
      if (d && daysBetween(now, d) >= 0 && daysBetween(now, d) < 7) {
        vol += trainingVolume(t)
        count += 1
      }
    }
    return { weeklyVolume: vol, weeklyCount: count }
  }, [history])

  const recent = history.slice(0, 5)
  const today = formatFullDate(new Date().toISOString().slice(0, 10))

  return (
    <>
      <TopBar />
      <div className="space-y-6 pt-5">
        <div className="px-4">
          <p className="text-[13px] font-500 text-ink-faint">{today}</p>
          <h1 className="mt-0.5 font-display text-[26px] font-800 leading-tight tracking-tight text-ink text-balance">
            Ready to train?
          </h1>
        </div>

        {/* Calendar */}
        <section className="px-4">
          <div className="rounded-2xl border border-hairline bg-card p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-[13px] font-600 uppercase tracking-wide text-ink-faint">Last 15 days</h2>
              <span className="text-[13px] font-500 text-ink-muted">
                {workoutDates.size} {workoutDates.size === 1 ? "session" : "sessions"}
              </span>
            </div>
            <CalendarStrip workoutDates={workoutDates} />
          </div>
        </section>

        {/* Stats */}
        <section className="grid grid-cols-2 gap-3 px-4">
          <StatCard
            icon={TrendingUp}
            label="Weekly Volume"
            value={`${formatVolume(weeklyVolume)}`}
            unit="kg"
          />
          <StatCard
            icon={Flame}
            label="This Week"
            value={`${weeklyCount}`}
            unit={weeklyCount === 1 ? "workout" : "workouts"}
          />
        </section>

        {/* Start workout */}
        <div className="px-4">
          <button
            onClick={onStart}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-accent py-4 font-display text-[16px] font-700 text-surface shadow-lg shadow-accent/20 transition-transform active:scale-[0.98]"
          >
            <Play size={19} fill="currentColor" strokeWidth={0} />
            Start Workout
          </button>
        </div>

        {/* Recent */}
        <div>
          <div className="flex items-center justify-between px-6 pb-2">
            <h2 className="font-display text-[17px] font-700 text-ink">Recent Workouts</h2>
          </div>

          {loading ? (
            <SkeletonList />
          ) : error ? (
            <ErrorState message={error} onRetry={onRetry} />
          ) : recent.length === 0 ? (
            <EmptyState />
          ) : (
            <InsetGroup>
              {recent.map((t) => (
                <WorkoutRow key={t.trainingId} training={t} />
              ))}
            </InsetGroup>
          )}
        </div>
      </div>
    </>
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
        <p className="font-display text-[15px] font-600 text-ink">No workouts yet</p>
        <p className="mt-1 text-[13px] text-ink-muted">Tap Start Workout to log your first session.</p>
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
          Try again
        </button>
      </div>
    </div>
  )
}
