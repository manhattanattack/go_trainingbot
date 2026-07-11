import { useCallback, useEffect, useState } from "react"
import BottomNav from "./components/BottomNav.jsx"
import OverviewPage from "./pages/OverviewPage.jsx"
import TrainingPage from "./pages/TrainingPage.jsx"
import ProfilePage from "./pages/ProfilePage.jsx"
import { fetchHistory } from "./lib/api.js"

export default function App() {
  const [tab, setTab] = useState("overview")
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

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
  }, [load])

  return (
    <div className="min-h-full bg-surface">
      <main className="mx-auto min-h-full max-w-md pb-24">
        {tab === "overview" && (
          <OverviewPage
            history={history}
            loading={loading}
            error={error}
            onRetry={load}
            onStart={() => setTab("log")}
            onShowAll={() => setTab("profile")}
          />
        )}
        {tab === "log" && <TrainingPage onSaved={load} goToOverview={() => setTab("overview")} />}
        {tab === "profile" && (
          <ProfilePage history={history} loading={loading} error={error} onRetry={load} />
        )}
      </main>
      <BottomNav active={tab} onChange={setTab} />
    </div>
  )
}
