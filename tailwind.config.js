/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#0d9e6e",
          dark: "#087a54",
          light: "#e6f7f2",
        },
        accent: "#f59e0b",
      },
      fontFamily: {
        sans: ["'DM Sans'", "sans-serif"],
        display: ["'DM Serif Display'", "serif"],
      },
      boxShadow: {
        card: "0 1px 3px rgba(0,0,0,.08), 0 4px 16px rgba(0,0,0,.06)",
        "card-lg": "0 8px 32px rgba(0,0,0,.12)",
      },
      keyframes: {
        fadeUp: {
          from: { opacity: 0, transform: "translateY(16px)" },
          to:   { opacity: 1, transform: "translateY(0)" },
        },
        pulse2: {
          "0%, 100%": { transform: "scale(1)" },
          "50%":       { transform: "scale(1.15)" },
        },
        spin2: {
          to: { transform: "rotate(360deg)" },
        },
      },
      animation: {
        "fade-up":   "fadeUp .4s ease both",
        "badge-pop": "pulse2 .4s ease",
        "spin-slow": "spin2 .8s linear infinite",
      },
    },
  },
  plugins: [],
};
