/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./*.html",
    "./src/**/*.js",
    "./agent/**/*.js"
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        background: "var(--bg)",
        "on-surface": "var(--ink)",
        primary: "var(--orange)",
        "primary-container": "var(--orange-deep)",
        surface: "var(--card-bg)",
        "surface-dim": "var(--nav-bg)",
        outline: "var(--border)",
        error: "var(--red)",
      },
      fontFamily: {
        headline: ['Space Grotesk', 'sans-serif'],
        body: ['Plus Jakarta Sans', 'sans-serif'],
        mono: ['Fira Code', 'monospace'],
      }
    }
  },
  plugins: [],
}
