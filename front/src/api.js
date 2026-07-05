/*
 * api.js — Работа с бекендом, Telegram SDK и утилиты
 *
 * Один файл со всеми «внешними» штуками: HTTP-запросы, Telegram, форматирование.
 * Компоненты импортируют отсюда только то, что им нужно.
 */

// ─── Telegram WebApp ──────────────────────────────────────
// tg будет undefined если открыть не в Telegram (например, в обычном браузере)
const tg = window.Telegram?.WebApp

// Вызвать один раз при старте приложения
export function initTelegram() {
  if (!tg) return
  tg.ready()   // сообщаем Telegram что приложение загрузилось
  tg.expand()  // разворачиваем на весь экран
}

// Тактильная обратная связь (вибрация в телефоне)
export function haptic(type = 'impact') {
  try {
    if (type === 'impact')  tg?.HapticFeedback?.impactOccurred('light')
    if (type === 'success') tg?.HapticFeedback?.notificationOccurred('success')
    if (type === 'error')   tg?.HapticFeedback?.notificationOccurred('error')
    if (type === 'select')  tg?.HapticFeedback?.selectionChanged()
  } catch (_) { /* не в Telegram — игнорируем */ }
}

// ─── HTTP ──────────────────────────────────────────────────
// Заголовки с авторизацией (если внутри Telegram)
function authHeaders(json = true) {
  const headers = {}
  if (json) headers['Content-Type'] = 'application/json'
  if (tg?.initData) headers['Authorization'] = `tma ${tg.initData}`
  return headers
}

// ─── API: сохранить тренировку ─────────────────────────────
export async function saveTraining(date, exercises) {
  const payload = {
    date,
    exercises: exercises.map(ex => ({
      baseExercise: ex.baseExercise,
      sets: ex.sets.map(s => ({
        weight: s.weight || 0,
        reps:   s.reps || 0,
        rpe:    s.rpe || 0,
        note:   '',
      })),
    })),
  }

  const res = await fetch('/api/training', {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || 'Ошибка сервера')
  }
  return res.json()
}

// ─── API: загрузить историю тренировок ─────────────────────
export async function fetchHistory() {
  const res = await fetch('/me', { headers: authHeaders(false) })
  if (!res.ok) throw new Error('Не удалось загрузить')
  return res.json()
}

// ─── Утилиты: работа с датами ──────────────────────────────
const MONTHS = [
  'января','февраля','марта','апреля','мая','июня',
  'июля','августа','сентября','октября','ноября','декабря',
]

// "2026-07-05" → "5 июля 2026"
export function formatDateRu(dateStr) {
  const d = new Date(dateStr)
  if (isNaN(d)) return dateStr
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`
}

// Сегодняшняя дата в формате "YYYY-MM-DD" (для <input type="date">)
export function todayISO() {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}
