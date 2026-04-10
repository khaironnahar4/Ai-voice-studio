import type { Config } from "tailwindcss"

const config: Config = {
  darkMode: "class",
  content:  [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        accent:  "rgb(var(--accent) / <alpha-value>)",
        surface: {
          DEFAULT: "rgb(var(--surface)   / <alpha-value>)",
          2:       "rgb(var(--surface-2) / <alpha-value>)",
          3:       "rgb(var(--surface-3) / <alpha-value>)",
        },
        vborder: "rgb(var(--vborder) / <alpha-value>)",
        cyan:    "rgb(var(--cyan)    / <alpha-value>)",
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)"],
        mono: ["var(--font-geist-mono)"],
      },
    },
  },
  plugins: [],
}

export default config