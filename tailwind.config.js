/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class", '[data-theme="dark"]', '[data-theme="dim"]'],
  content: ["./public/index.html", "./src/**/*.{vue,js,ts}"],
  theme: {
    extend: {
      colors: {
        bg: "var(--bg)",
        surface: "var(--panel)",
        "surface-2": "var(--panel-2)",
        text: "var(--text)",
        muted: "var(--muted)",
        border: "var(--line)",
        primary: "var(--accent)",
        "primary-contrast": "var(--accent-contrast)",
        // note accents reused as semantic statuses
        success: "var(--note-success-accent)",
        warning: "var(--note-warn-accent)",
        danger: "var(--note-error-accent)",
        info: "var(--note-info-accent)",
      },
      spacing: {
        page: "var(--layout-padding)",
        gap: "var(--layout-gap)",
        chat: "var(--chat-padding)",
      },
      borderRadius: {
        card: "var(--radius-lg)",
        pill: "9999px",
      },
      boxShadow: {
        soft: "var(--shadow-sm)",
      },
    },
  },
  plugins: [],
};
