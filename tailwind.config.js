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
          bg: 'var(--chat-bg, var(--bg, #ffffff))',
          surface: 'var(--surface, var(--control-bg, #ffffff))',
          muted: 'var(--surface-muted, var(--control-hover, #f7f7f8))',
          border: 'var(--control-border, var(--border, #e5e7eb))',
          text: 'var(--text, #202123)',
          subtle: 'var(--text-muted, #6b7280)',
          primary: 'var(--primary, #10a37f)',
          primaryStrong: 'var(--primary-strong, #0e8f71)',
          primarySoft: 'var(--primary-soft, rgba(16, 163, 127, 0.12))',
          hover: 'var(--control-hover, var(--surface-muted, #f3f4f6))',
          elevated: 'var(--surface-elevated, var(--surface, #ffffff))',
          sidebar: 'var(--sidebar-bg, var(--surface, #ffffff))',
          menu: 'var(--menu-bg, var(--surface, #ffffff))',
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
        toast: 'var(--z-toast, 1300)',
        modal: 'var(--z-modal, 1100)',
        popover: 'var(--z-popover, 900)',
      },
      animation: {
        'spin-fast': 'spin 0.8s linear infinite',
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
      addVariant('theme-dark', ':root[data-theme="dark"] &');
      addVariant('theme-light', ':root[data-theme="light"] &');
      addVariant('theme-spring', ':root[data-theme="spring"] &');
      addVariant('theme-summer', ':root[data-theme="summer"] &');
      addVariant('theme-autumn', ':root[data-theme="autumn"] &');
      addVariant('theme-winter', ':root[data-theme="winter"] &');
    }),
  ],
};
