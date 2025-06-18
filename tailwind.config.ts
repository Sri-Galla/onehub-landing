import type { Config } from 'tailwindcss'

const config: Config = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-geist)', 'sans-serif'],     // ✅ For general UI
        mono: ['Geist Mono', 'monospace'],             // ✅ For terminal look
      },
    },
  },
  plugins: [],
}

export default config
