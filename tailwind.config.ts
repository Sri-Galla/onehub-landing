import type { Config } from 'tailwindcss';

const config: Config = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "#0D1117",
        panel: "#161B22",
        border: "#30363D",
        hover: "#1C222B",
        action: "#1F4B99",
        "action-hover": "#173B7F",
        "text-primary": "#F0F6FC",
        "text-secondary": "#8B949E",
        "text-disabled": "#6E7681",
        glow: "#00FFA0",
        // Brand-specific additions
        "brand-cobalt": "#1F4B99", // same as action
        "brand-green": "#3BAA6D",
        "accent-red": "#E5484D",
      },
      fontFamily: {
        sans: ['var(--font-geist)', 'sans-serif'], // For UI text
        mono: ['Geist Mono', 'monospace'],         // For terminal
      },
    },
  },
  plugins: [],
};

export default config;
