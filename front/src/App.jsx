import { useCallback, useEffect, useState } from "react"
import BottomNav from "./components/BottomNav.jsx"
import OverviewPage from "./pages/OverviewPage.jsx"
import TrainingPage from "./pages/TrainingPage.jsx"
import ProfilePage from "./pages/ProfilePage.jsx"
import ProgressPage from "./pages/ProgressPage.jsx"
import WorkoutDetailPage from "./pages/WorkoutDetailPage.jsx"
import { authUser, fetchHistory, fetchProfile, updateProfile } from "./lib/api.js"
import { toISODate } from "./lib/format.js"


export default function App() {
  const [tab, setTab] = useState("overview")
  // Draft (unsaved) workout state lifted to the app root so it survives
  // switching between bottom-nav tabs for the whole session. Intentionally
  // in-memory only (no localStorage/sessionStorage) per Telegram Mini App constraints.
  const [draftDate, setDraftDate] = useState(() => toISODate(new Date()))
  const [draftExercises, setDraftExercises] = useState([])
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [profile, setProfile] = useState({ name: "", height: 0, weight: 0 })
  const [profileLoading, setProfileLoading] = useState(true)
  const [workoutDetail, setWorkoutDetail] = useState(null)
  const [splashPhase, setSplashPhase] = useState("visible")


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

  async function initProfile() {
    setProfileLoading(true)
    try {
      await authUser()
      // Сразу после этого запрашиваем обновленный профиль из базы
      const data = await fetchProfile()
      setProfile(data)
    } catch (err) {
      console.warn("Ошибка инициализации профиля:", err)
      setProfile({ name: "???", height: 0, weight: 0 })
    } finally {
      setProfileLoading(false)
    }
  }

  useEffect(() => {
    try {
    import("@twa-dev/sdk").then((module) => {
      module.default.ready();
    });
    } catch (e) {
      console.error("TMA init failed", e);
    }
    initProfile()
    load()
      .then(setProfile)
      .catch(() => setProfile({ name: "???", height: 0, weight: 0 }))
      .finally(() => setProfileLoading(false))
  }, [load])

  useEffect(() => {
    if (loading || profileLoading || splashPhase !== "visible") return
    const exitTimer = window.setTimeout(() => setSplashPhase("leaving"), 650)
    return () => window.clearTimeout(exitTimer)
  }, [loading, profileLoading, splashPhase])

  useEffect(() => {
    if (splashPhase !== "leaving") return
    const removeTimer = window.setTimeout(() => setSplashPhase("hidden"), 350)
    return () => window.clearTimeout(removeTimer)
  }, [splashPhase])

  const saveProfile = useCallback(async (nextProfile) => {
    const saved = await updateProfile(nextProfile)
    setProfile(saved)
    return saved
  }, [])

  const screenKey = workoutDetail ? `workout-${workoutDetail.training.trainingId}` : tab

  return (
    <div className="min-h-full bg-surface">
      <main className={`mx-auto min-h-full max-w-md ${workoutDetail ? "" : "pb-24"}`}>
        <div key={screenKey} className="page-enter">
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
            date={draftDate}
            setDate={setDraftDate}
            exercises={draftExercises}
            setExercises={setDraftExercises}
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
        </div>
      </main>
      {!workoutDetail && <BottomNav active={tab} onChange={setTab} />}
      {splashPhase !== "hidden" && (
        <div
          className={`splash-screen ${splashPhase === "leaving" ? "splash-screen--leaving" : ""}`}
          aria-hidden="true"
        >
          <span className="splash-logo font-display">kOre</span>
        </div>
      )}
    </div>
  )
}
