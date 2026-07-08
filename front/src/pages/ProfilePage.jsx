import { useMemo } from "react"
import { Dumbbell, Layers, Flame, Settings, ChevronRight, AlertCircle } from "lucide-react"
import TopBar from "../components/TopBar.jsx"
import WorkoutRow from "../components/WorkoutRow.jsx"
import { InsetGroup } from "../components/InsetList.jsx"
import { trainingVolume, trainingSetCount, formatVolume } from "../lib/format.js"

export default function ProfilePage({ history, loading, error, onRetry }) {
  const stats = useMemo(() => {
    let volume = 0
    let sets = 0
    for (const t of history) {
      volume += trainingVolume(t)
      sets += trainingSetCount(t)
    }
    return { volume, sets, workouts: history.length }
  }, [history])

  return (
    <>
      <TopBar title="Profile" />

      <div className="space-y-6 pt-5">
        {/* Identity */}
        <section className="flex flex-col items-center px-4">
          <div className="flex h-20 w-20 items-center justify-center rounded-full border border-hairline-strong bg-card">
            <span className="font-display text-[28px] font-800 text-accent">A</span>
          </div>
          <h1 className="mt-3 font-display text-[20px] font-800 tracking-tight text-ink">Alex Carter</h1>
          <p className="text-[13px] font-500 text-ink-muted">Member since 2023</p>
        </section>

        {/* All-time stats */}
        <section className="grid grid-cols-3 gap-3 px-4">
          <StatTile icon={Layers} value={formatVolume(stats.volume)} unit="kg" label="Volume" />
          <StatTile icon={Dumbbell} value={stats.workouts} label="Workouts" />
          <StatTile icon={Flame} value={stats.sets} label="Total Sets" />
        </section>

        {/* Settings */}
        <InsetGroup header="Preferences">
          <SettingRow icon={Settings} label="Units" value="Kilograms" />
          <SettingRow icon={Flame} label="Weekly Goal" value="4 workouts" />
        </InsetGroup>

        {/* Full history */}
        <div>
          <div className="flex items-center justify-between px-6 pb-2">
            <h2 className="font-display text-[17px] font-700 text-ink">History</h2>
            {!loading && !error && (
              <span className="text-[13px] font-500 text-ink-faint">{history.length} total</span>
            )}
          </div>

          {loading ? (
            <div className="px-4">
              <div className="overflow-hidden rounded-2xl border border-hairline bg-card">
                {[0, 1, 2, 3].map((i) => (
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
          ) : error ? (
            <div className="px-4">
              <div className="flex flex-col items-center rounded-2xl border border-hairline bg-card px-6 py-8 text-center">
                <AlertCircle size={22} className="text-accent" />
                <p className="mt-2 text-[14px] font-500 text-ink">{error}</p>
                <button
                  onClick={onRetry}
                  className="mt-3 rounded-full bg-card-2 px-4 py-2 text-[13px] font-600 text-ink active:bg-hairline-strong"
                >
                  Try again
                </button>
              </div>
            </div>
          ) : history.length === 0 ? (
            <div className="px-4">
              <div className="rounded-2xl border border-dashed border-hairline-strong bg-card/40 px-6 py-10 text-center">
                <p className="font-display text-[15px] font-600 text-ink">No history yet</p>
                <p className="mt-1 text-[13px] text-ink-muted">Your logged workouts will appear here.</p>
              </div>
            </div>
          ) : (
            <InsetGroup>
              {history.map((t) => (
                <WorkoutRow key={t.trainingId} training={t} />
              ))}
            </InsetGroup>
          )}
        </div>
      </div>
    </>
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
      <p className="mt-1 text-[11px] font-500 uppercase tracking-wide text-ink-faint">{label}</p>
    </div>
  )
}

function SettingRow({ icon: Icon, label, value }) {
  return (
    <div className="flex w-full items-center gap-3 px-4 py-3">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-soft text-accent">
        <Icon size={16} />
      </span>
      <span className="flex-1 text-[15px] font-500 text-ink">{label}</span>
      <span className="text-[14px] text-ink-muted">{value}</span>
      <ChevronRight size={17} className="text-ink-faint" />
    </div>
  )
}
