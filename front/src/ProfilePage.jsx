/*
 * ProfilePage.jsx — Вкладка «Профиль»
 *
 * useEffect(функция, [зависимости]) — выполняет код ПОСЛЕ рендера.
 * Пустой массив [] = выполнить один раз при первом показе компонента.
 * Аналог init() или defer в Go, но для UI.
 */

import { useState, useEffect } from 'react'
import { fetchHistory, formatDateRu } from './api'
import { getExerciseById } from './exercises'

function ProfilePage() {
  // null = ещё загружается, [] = загрузилось но пусто
  const [history, setHistory] = useState(null)
  const [error, setError] = useState(false)

  // Загружаем историю один раз при открытии вкладки
  useEffect(() => {
    loadHistory()
  }, [])

  async function loadHistory() {
    setError(false)
    setHistory(null)
    try {
      const data = await fetchHistory()
      setHistory(data || [])
    } catch {
      setError(true)
    }
  }

  // ─── Считаем статистику ───
  const totalTrainings = history ? history.length : 0
  let totalExercises = 0
  if (history) {
    history.forEach(t => { totalExercises += (t.exercises?.length || 0) })
  }

  // ─── Рендер ───

  return (
    <div className="page">
      <div className="page-header">
        <h1>Профиль</h1>
      </div>

      {/* Аватар */}
      <div className="profile-header">
        <div className="profile-avatar">🏆</div>
        <div className="profile-name">Атлет</div>
        <div className="profile-sub">Твой трекер тренировок</div>
      </div>

      {/* Статистика */}
      <div className="stats-row">
        <div className="card stat-card">
          <div className="stat-value">{totalTrainings || '—'}</div>
          <div className="stat-label">Тренировок</div>
        </div>
        <div className="card stat-card">
          <div className="stat-value">{totalExercises || '—'}</div>
          <div className="stat-label">Упражнений</div>
        </div>
      </div>

      {/* История */}
      <div className="section-title">История тренировок</div>

      {/* Загрузка */}
      {history === null && !error && (
        <div className="empty-state">
          <div className="spinner" />
        </div>
      )}

      {/* Ошибка */}
      {error && (
        <div className="empty-state">
          <div className="empty-icon">⚡</div>
          <p>Не удалось загрузить историю</p>
        </div>
      )}

      {/* Пусто */}
      {history && history.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">📝</div>
          <p>Пока нет тренировок.<br />Время начинать!</p>
        </div>
      )}

      {/* Список тренировок */}
      {history && history.length > 0 && history.map((training, i) => (
        <div className="card history-card" key={training.trainingId || i}>
          <div className="history-date">{formatDateRu(training.date)}</div>
          <div className="history-exercises">
            {training.exercises?.map((ex, j) => {
              const info = getExerciseById(ex.baseExercise)
              return (
                <div className="history-exercise-row" key={ex.exerciseId || j}>
                  <div className="history-dot" />
                  <span>{info.name}</span>
                  <span className="history-sets-count">{ex.sets?.length || 0} подх.</span>
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

export default ProfilePage
