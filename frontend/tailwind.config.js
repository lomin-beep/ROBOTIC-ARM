/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        saedge: {
          dark: "#0f172a",
          panel: "#1e293b",
          accent: "#22d3ee",
          accentDim: "#0891b2",
          danger: "#ef4444",
          success: "#22c55e",
          warning: "#f59e0b",
          muted: "#64748b",
        },
      },
      animation: {
        "pulse-fast": "pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        blink: "blink 1.2s step-end infinite",
      },
      keyframes: {
        blink: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.35" },
        },
      },
    },
  },
  plugins: [],
}
