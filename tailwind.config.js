/** @type {import('tailwindcss').Config} */
const plugin = require('tailwindcss/plugin');

module.exports = {
  content: ['./public/index.html', './src/**/*.{vue,js}'],
  darkMode: ['class', 'body.theme-dark'],
  corePlugins: {
    preflight: false,
  },
  theme: {
    extend: {
      colors: {
        app: {
          bg: 'var(--bg, #ffffff)',
          surface: 'var(--surface, #ffffff)',
          muted: 'var(--surface-muted, #f7f7f8)',
          border: 'var(--border, var(--control-border, #e5e7eb))',
          text: 'var(--text, #202123)',
          subtle: 'var(--text-muted, #6b7280)',
          primary: 'var(--primary, #10a37f)',
          primaryStrong: 'var(--primary-strong, #0e8f71)',
          primarySoft: 'var(--primary-soft, rgba(16, 163, 127, 0.12))',
          hover: 'var(--control-hover, var(--surface-muted, #f3f4f6))',
          danger: 'var(--danger, #dc2626)',
        },
      },
      borderRadius: {
        ui: '5px',
      },
      boxShadow: {
        soft: '0 14px 36px rgba(15, 23, 42, 0.12)',
      },
      zIndex: {
        studio: 'var(--z-sticky-control, 100)',
        overlay: 'var(--z-overlay, 1200)',
      },
    },
  },
  plugins: [
    plugin(function({addVariant}) {
      addVariant('mobile', 'body.mobile-mode &');
      addVariant('desktop', 'body.desktop-mode &');
      addVariant('studio-mode', '.chat-container-root--mode-studio &');
      addVariant('mobile-studio', 'body.mobile-mode .chat-container-root--mode-studio &');
      addVariant('desktop-studio', 'body.desktop-mode .chat-container-root--mode-studio &');
    }),
  ],
};
