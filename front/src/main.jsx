/*
 * main.jsx — Точка входа. Монтирует React-приложение в DOM.
 *
 * Это аналог func main() в Go — отсюда всё начинается.
 * createRoot находит <div id="root"> в index.html и рендерит туда <App />.
 */
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './App.css'
import { initTelegram } from './api'

// Инициализируем Telegram SDK
initTelegram()

// Монтируем приложение
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
)
