/*
 * ExerciseCard.jsx — Карточка одного упражнения с подходами
 *
 * Props (аргументы от родителя):
 *   exercise  — { baseExercise: число, sets: [{weight, reps, rpe}] }
 *   onUpdate  — колбэк: «данные изменились, вот новая версия»
 *   onRemove  — колбэк: «удали меня»
 *
 * Этот компонент НЕ хранит данные у себя.
 * Все данные приходят сверху (от TrainingPage) через props,
 * и все изменения отправляются наверх через onUpdate.
 * Это стандартный паттерн React — «подъём состояния» (lifting state up).
 */

import { getExerciseById } from './exercises'
import { haptic } from './api'

function ExerciseCard({ exercise, onUpdate, onRemove }) {
  const info = getExerciseById(exercise.baseExercise)

  // Обновить одно поле в одном подходе
  function updateSet(setIndex, field, value) {
    // .map создаёт новый массив, заменяя нужный элемент
    const newSets = exercise.sets.map((s, i) =>
      i === setIndex ? { ...s, [field]: value } : s
    )
    // Отправляем наверх новую версию упражнения
    onUpdate({ ...exercise, sets: newSets })
  }

  // Добавить подход (копируем значения из последнего)
  function addSet() {
    haptic('select')
    const last = exercise.sets[exercise.sets.length - 1]
    const newSet = {
      weight: last?.weight || 0,
      reps:   last?.reps || 0,
      rpe:    last?.rpe || 0,
    }
    onUpdate({ ...exercise, sets: [...exercise.sets, newSet] })
  }

  // Удалить подход. Если подходов не осталось — удаляем всё упражнение.
  function removeSet(setIndex) {
    haptic('impact')
    const newSets = exercise.sets.filter((_, i) => i !== setIndex)
    if (newSets.length === 0) {
      onRemove()  // подходов нет → удаляем упражнение целиком
    } else {
      onUpdate({ ...exercise, sets: newSets })
    }
  }

  return (
    <div className="card exercise-card">

      {/* Заголовок: эмодзи + название + кнопка удаления */}
      <div className="exercise-header">
        <div className="exercise-title">
          <div className="exercise-emoji">{info.emoji}</div>
          <span className="exercise-name">{info.name}</span>
        </div>
        <button className="btn-remove" onClick={onRemove}>×</button>
      </div>

      {/* Шапка таблицы */}
      <div className="sets-header">
        <span>#</span>
        <span>Вес</span>
        <span>Повт</span>
        <span>RPE</span>
        <span></span>
      </div>

      {/* Строки подходов */}
      {exercise.sets.map((set, i) => (
        <div className="set-row" key={i}>
          <div className="set-number">{i + 1}</div>

          <input
            className="set-input"
            type="number"
            inputMode="decimal"
            step="0.5"
            placeholder="0"
            value={set.weight || ''}
            onChange={e => updateSet(i, 'weight', parseFloat(e.target.value) || 0)}
          />

          <input
            className="set-input"
            type="number"
            inputMode="numeric"
            placeholder="0"
            value={set.reps || ''}
            onChange={e => updateSet(i, 'reps', parseInt(e.target.value) || 0)}
          />

          <input
            className="set-input"
            type="number"
            inputMode="numeric"
            min="1"
            max="10"
            placeholder="—"
            value={set.rpe || ''}
            onChange={e => updateSet(i, 'rpe', parseInt(e.target.value) || 0)}
          />

          <button className="set-remove" onClick={() => removeSet(i)}>×</button>
        </div>
      ))}

      {/* Кнопка добавления подхода */}
      <button className="btn-add-set" onClick={addSet}>+ подход</button>
    </div>
  )
}

export default ExerciseCard
