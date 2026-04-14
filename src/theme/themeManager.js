export function applyThemeAttributes(config) {
  const root = document.documentElement;
  root.setAttribute('data-theme', config.theme || 'default');
  root.setAttribute('data-device', config.device || 'desktop');
  root.setAttribute('data-platform', config.platform || 'web');
}
