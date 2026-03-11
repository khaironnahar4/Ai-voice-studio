import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ["var(--font-syne)", "sans-serif"],
        sans: ["var(--font-dm)", "sans-serif"],
      },
      colors: {
        // Vapor Wave Pro palette
        accent: {
          DEFAULT: "rgb(var(--accent) / <alpha-value>)",
          2: "rgb(var(--accent2) / <alpha-value>)",
        },
        surface: {
          DEFAULT: "rgb(var(--surface) / <alpha-value>)",
          2: "rgb(var(--surface2) / <alpha-value>)",
        },
        vocera: {
          bg:     '#0F0F1A',
          card:   '#16162A',
          card2:  '#1E1E3A',
          purple: '#6C3CE1',
          violet: '#9B6FF5',
          muted:  '#A0A0C8',
          subtle: '#64648C',
        },
      },
      maxWidth: {
        '8xl': '1280px',
      },
      boxShadow: {
        'glow-sm': '0 0 12px rgba(108,60,225,0.5)',
        'glow':    '0 0 30px rgba(108,60,225,0.4), 0 0 60px rgba(108,60,225,0.15)',
      },
      keyframes: {
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        pulse2: {
          "0%, 100%": { opacity: "0.4", transform: "scale(1)" },
          "50%": { opacity: "0.9", transform: "scale(1.1)" },
        },
        spin: {
          to: { transform: "rotate(360deg)" },
        },
        waveBar: {
          "0%, 100%": { transform: "scaleY(0.2)" },
          "50%": { transform: "scaleY(1)" },
        },
      },
      animation: {
        fadeUp: "fadeUp 0.4s ease both",
        pulse2: "pulse2 2s ease-in-out infinite",
        spin: "spin 0.7s linear infinite",
        waveBar: "waveBar 1s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
