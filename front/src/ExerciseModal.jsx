/*
 * ExerciseModal.jsx — Модалка (bottom sheet) для выбора упражнения
 *
 * Выезжает снизу, показывает список упражнений с поиском.
 * При выборе вызывает onSelect(exercise), при закрытии — onClose().
 */

import { useState } from 'react'
import EXERCISES from './exercises'
import { haptic } from './api'

function ExerciseModal({ onSelect, onClose }) {
  const [search, setSearch] = useState('')

  // Фильтруем список по поисковому запросу
  const filtered = search.trim()
    ? EXERCISES.filter(ex => ex.name.toLowerCase().includes(search.toLowerCase()))
    : EXERCISES

  // Для заголовков групп (Грудь, Ноги, ...) отслеживаем текущую группу
  let currentGroup = ''

  return (
    <div className="modal">
      {/* Затемнение — клик по нему закрывает модалку */}
      <div className="modal-backdrop" onClick={onClose} />

      <div className="modal-sheet">
        <div className="sheet-handle" />
        <div className="modal-title">Выберите упражнение</div>

        {/* Поиск */}
        <input
          className="search-input"
          type="text"
          placeholder="Поиск упражнения..."
          autoFocus
          value={search}
          onChange={e => setSearch(e.target.value)}
        />

        {/* Список упражнений */}
        <div>
          {filtered.map(ex => {
            // Показываем заголовок группы, если она поменялась
            let groupLabel = null
            if (ex.group !== currentGroup) {
              currentGroup = ex.group
              groupLabel = (
                <div className="exercise-group-label" key={`group-${ex.group}`}>
                  {ex.group}
                </div>
              )
            }

            return (
              <div key={ex.id}>
                {groupLabel}
                <div
                  className="exercise-list-item"
                  onClick={() => { haptic('select'); onSelect(ex) }}
                >
                  <div className="item-emoji">{ex.emoji}</div>
                  <span className="item-name">{ex.name}</span>
                </div>
              </div>
            )
          })}

          {filtered.length === 0 && (
            <div className="empty-state">
              <p>Ничего не найдено</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ExerciseModal
