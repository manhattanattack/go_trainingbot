import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],

  // Продакшен-сборка: результат кладём в ../static/,
  // чтобы Go-сервер раздавал их через http.FileServer
  build: {
    outDir: '../static',
    emptyOutDir: true,
  },

  // Для разработки: Vite крутится на :5173,
  // а все запросы к API проксирует на Go-бекенд (:8080)
  server: {
    proxy: {
      '/api': 'http://localhost:8080',
      '/me': 'http://localhost:8080',
    },
  },
})
