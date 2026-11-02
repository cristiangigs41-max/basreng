import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import { defineConfig, loadEnv } from 'vite'
import { chatMiddleware } from './server/chat.js'

// Endpoint chatbot AI (/ai-chat) ikut berjalan di `npm run dev` dan `npm run preview`.
const aiChat = (env) => ({
  name: 'ai-chat',
  configureServer(s) { s.middlewares.use(chatMiddleware(env)) }, // jangan di-return (Vite menganggap fungsi balikan sebagai hook)
  configurePreviewServer(s) { s.middlewares.use(chatMiddleware(env)) },
})

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = { ...process.env, ...loadEnv(mode, process.cwd(), '') } // baca ANTHROPIC_API_KEY dari .env
  return {
    base: env.BASE_PATH || '/', // GitHub Pages: diisi otomatis oleh workflow (/nama-repo/)
    plugins: [
      react(),
      babel({ presets: [reactCompilerPreset()] }),
      aiChat(env),
    ],
  }
})
