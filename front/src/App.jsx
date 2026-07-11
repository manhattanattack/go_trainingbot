import { useCallback, useEffect, useState } from "react"
import BottomNav from "./components/BottomNav.jsx"
import OverviewPage from "./pages/OverviewPage.jsx"
import TrainingPage from "./pages/TrainingPage.jsx"
import ProfilePage from "./pages/ProfilePage.jsx"
import ProgressPage from "./pages/ProgressPage.jsx"
import WorkoutDetailPage from "./pages/WorkoutDetailPage.jsx"
import { fetchHistory, fetchProfile, updateProfile } from "./lib/api.js"

export default function App() {
  const [tab, setTab] = useState("overview")
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [profile, setProfile] = useState({ name: "", height: 0, weight: 0 })
  const [profileLoading, setProfileLoading] = useState(true)
  const [workoutDetail, setWorkoutDetail] = useState(null)

  const openWorkout = useCallback((training) => {
    setWorkoutDetail({ training, returnTab: tab })
  }, [tab])

  const closeWorkout = useCallback(() => {
    setTab(workoutDetail?.returnTab || "overview")
    setWorkoutDetail(null)
  }, [workoutDetail])

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchHistory()
      // Sort most-recent first.
      data.sort((a, b) => (a.date < b.date ? 1 : -1))
      setHistory(data)
    } catch (err) {
      setError(err.message || "Не удалось связаться с сервером")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
    fetchProfile()
      .then(setProfile)
      .catch(() => setProfile({ name: "Алекс Картер", height: 0, weight: 0 }))
      .finally(() => setProfileLoading(false))
  }, [load])

  const saveProfile = useCallback(async (nextProfile) => {
    const saved = await updateProfile(nextProfile)
    setProfile(saved)
    return saved
  }, [])

  return (
    <div className="min-h-full bg-surface">
      <main className={`mx-auto min-h-full max-w-md ${workoutDetail ? "" : "pb-24"}`}>
        {workoutDetail ? (
          <WorkoutDetailPage
            training={workoutDetail.training}
            history={history}
            onBack={closeWorkout}
          />
        ) : tab === "overview" && (
          <OverviewPage
            history={history}
            loading={loading}
            error={error}
            onRetry={load}
            onStart={() => setTab("log")}
            onShowAll={() => setTab("profile")}
            onOpenWorkout={openWorkout}
          />
        )}
        {!workoutDetail && tab === "log" && (
          <TrainingPage
            history={history}
            historyLoading={loading}
            onSaved={load}
            goToOverview={() => setTab("overview")}
          />
        )}
        {!workoutDetail && tab === "progress" && (
          <ProgressPage history={history} loading={loading} error={error} onRetry={load} />
        )}
        {!workoutDetail && tab === "profile" && (
          <ProfilePage
            history={history}
            loading={loading}
            error={error}
            onRetry={load}
            profile={profile}
            profileLoading={profileLoading}
            onSaveProfile={saveProfile}
            onOpenWorkout={openWorkout}
          />
        )}
      </main>
      {!workoutDetail && <BottomNav active={tab} onChange={setTab} />}
    </div>
  )
}
