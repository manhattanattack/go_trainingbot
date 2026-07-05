/*
 * TrainingPage.jsx — Вкладка «Тренировка»
 *
 * Содержит:
 *  - Выбор даты
 *  - Список добавленных упражнений (ExerciseCard)
 *  - Кнопку «Добавить упражнение» → открывает модалку (ExerciseModal)
 *  - Кнопку «Сохранить» → отправляет на бекенд
 *
 * Весь стейт тренировки (дата, упражнения, подходы) живёт ЗДЕСЬ.
 * Дочерние компоненты получают данные через props и
 * сообщают об изменениях через колбэки (onUpdate, onRemove).
 */

import { useState } from 'react'
import ExerciseCard from './ExerciseCard'
import ExerciseModal from './ExerciseModal'
import { saveTraining, formatDateRu, todayISO, haptic } from './api'

function TrainingPage({ showToast }) {
  const [date, setDate] = useState(todayISO())
  const [exercises, setExercises] = useState([])   // [{ baseExercise: id, sets: [{weight, reps, rpe}] }]
  const [modalOpen, setModalOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  // ─── Обработчики ───

  // Пользователь выбрал упражнение из модалки
  function handleAddExercise(exercise) {
    setExercises(prev => [...prev, {
      baseExercise: exercise.id,
      sets: [{ weight: 0, reps: 0, rpe: 0 }],  // один пустой подход по умолчанию
    }])
    setModalOpen(false)
  }

  // Удалить упражнение
  function handleRemoveExercise(index) {
    haptic('impact')
    setExercises(prev => prev.filter((_, i) => i !== index))
  }

  // Обновить упражнение (вызывается из ExerciseCard при изменении подходов)
  function handleUpdateExercise(index, updated) {
    setExercises(prev => {
      const copy = [...prev]
      copy[index] = updated
      return copy
    })
  }

  // Сохранить тренировку на бекенд
  async function handleSave() {
    if (exercises.length === 0) {
      showToast('Добавь хотя бы одно упражнение', 'error')
      haptic('error')
      return
    }

    setSaving(true)
    try {
      await saveTraining(date, exercises)
      showToast('✅ Тренировка сохранена!')
      haptic('success')
      // Сбрасываем форму
      setExercises([])
      setDate(todayISO())
    } catch (err) {
      showToast(`Ошибка: ${err.message}`, 'error')
      haptic('error')
    } finally {
      setSaving(false)
    }
  }

  // ─── Рендер ───

  return (
    <div className="page">
      <div className="page-header">
        <h1>Тренировка</h1>
        <p className="subtitle">Запиши свой прогресс</p>
      </div>

      {/* ── Дата ── */}
      <div className="card date-card">
        <div className="date-icon">📅</div>
        <div className="date-info">
          <div className="date-value">{formatDateRu(date)}</div>
          <div className="date-label">Дата тренировки</div>
        </div>
        <input
          type="date"
          value={date}
          onChange={e => setDate(e.target.value)}
        />
      </div>

      {/* ── Список упражнений ── */}
      {exercises.map((ex, i) => (
        <ExerciseCard
          key={i}
          exercise={ex}
          onUpdate={updated => handleUpdateExercise(i, updated)}
          onRemove={() => handleRemoveExercise(i)}
        />
      ))}

      {/* ── Добавить упражнение ── */}
      <button
        className="btn btn-secondary"
        onClick={() => { haptic('impact'); setModalOpen(true) }}
      >
        <span>＋</span> Добавить упражнение
      </button>

      {/* ── Сохранить ── */}
      <div className="save-section">
        <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
          {saving
            ? <><div className="spinner" /> Сохраняю...</>
            : '💾  Сохранить тренировку'
          }
        </button>
      </div>

      {/* ── Модалка выбора упражнения ── */}
      {modalOpen && (
        <ExerciseModal
          onSelect={handleAddExercise}
          onClose={() => setModalOpen(false)}
        />
      )}
    </div>
  )
}

export default TrainingPage
