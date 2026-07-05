/*
 * App.jsx — Корневой компонент приложения
 *
 * ╔══════════════════════════════════════════════════════════╗
 * ║  ШПАРГАЛКА ПО REACT (для бэкендера)                    ║
 * ╠══════════════════════════════════════════════════════════╣
 * ║                                                         ║
 * ║  Компонент = функция, которая возвращает JSX.           ║
 * ║  JSX — это HTML, но внутри JavaScript.                  ║
 * ║                                                         ║
 * ║  useState(начальное) → [значение, setЗначение]          ║
 * ║    Как переменная, но при изменении React перерисует UI. ║
 * ║    Аналогия: представь что Go-шаблон автоматически       ║
 * ║    обновляется когда меняешь переменную.                 ║
 * ║                                                         ║
 * ║  props — аргументы компонента.                           ║
 * ║    <MyComp name="Вася" /> → внутри: props.name === "Вася"║
 * ║    Как аргументы функции в Go.                           ║
 * ║                                                         ║
 * ║  {условие && <Компонент />}                              ║
 * ║    Если условие true — показываем. Аналог {{if}} в Go.   ║
 * ║                                                         ║
 * ╚══════════════════════════════════════════════════════════╝
 */

import { useState } from 'react'
import TrainingPage from './TrainingPage'
import ProfilePage from './ProfilePage'
import { haptic } from './api'

function App() {
  // Какая вкладка сейчас активна
  const [tab, setTab] = useState('training')

  // Данные для toast-уведомления (всплывающая плашка вверху)
  const [toast, setToast] = useState({ message: '', type: 'success', visible: false })

  // Показать уведомление на 2.5 секунды
  function showToast(message, type = 'success') {
    setToast({ message, type, visible: true })
    setTimeout(() => {
      setToast(prev => ({ ...prev, visible: false }))
    }, 2500)
  }

  // Переключение вкладки
  function switchTab(newTab) {
    if (tab === newTab) return
    haptic('select')
    setTab(newTab)
  }

  return (
    <div id="app">

      {/* Показываем только одну страницу. React сам уберёт/добавит нужный компонент. */}
      {tab === 'training' && <TrainingPage showToast={showToast} />}
      {tab === 'profile'  && <ProfilePage />}

      {/* Toast-уведомление — всегда в DOM, видимость через CSS-класс */}
      <div className={`toast ${toast.type} ${toast.visible ? 'visible' : ''}`}>
        {toast.message}
      </div>

      {/* ─── Нижняя навигация ─── */}
      <nav className="bottom-nav">
        <button
          className={`nav-btn ${tab === 'training' ? 'active' : ''}`}
          onClick={() => switchTab('training')}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
               strokeLinecap="round" strokeLinejoin="round">
            <circle cx="4.5" cy="6.5" r="2" />
            <circle cx="19.5" cy="6.5" r="2" />
            <line x1="2" y1="10" x2="22" y2="10" />
            <line x1="4.5" y1="10" x2="4.5" y2="14" />
            <line x1="19.5" y1="10" x2="19.5" y2="14" />
            <rect x="7" y="8" width="10" height="4" rx="1" />
          </svg>
          <span>Тренировка</span>
        </button>

        <button
          className={`nav-btn ${tab === 'profile' ? 'active' : ''}`}
          onClick={() => switchTab('profile')}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
               strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="8" r="4" />
            <path d="M5.5 21a6.5 6.5 0 0 1 13 0" />
          </svg>
          <span>Профиль</span>
        </button>
      </nav>
    </div>
  )
}

export default App
