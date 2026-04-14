const DEFAULT_CONFIG = {
  platform: 'web',
  device: 'desktop',
  theme: 'default',
  apiVersion: 'v1',
  customer: 'default',
  apiBaseUrl: '',
  endpoints: {
    chat: {
      web: '/mock/chat.rooms.web.json',
      app: '/mock/chat.rooms.app.json',
      extension: '/mock/chat.rooms.extension.json',
      v2: '/mock/chat.rooms.v2.json'
    }
  }
};

let runtimeConfig = null;

function readQueryOverrides() {
  const params = new URLSearchParams(window.location.search || '');
  return {
    platform: params.get('platform') || undefined,
    device: params.get('device') || undefined,
    theme: params.get('theme') || undefined,
    apiVersion: params.get('apiVersion') || undefined,
    customer: params.get('customer') || undefined
  };
}

export function initializeAppConfig() {
  const overrides = readQueryOverrides();
  runtimeConfig = {
    ...DEFAULT_CONFIG,
    ...Object.fromEntries(Object.entries(overrides).filter(function ([, value]) {
      return value !== undefined && value !== null && value !== '';
    }))
  };
  return runtimeConfig;
}

export function getAppConfig() {
  return runtimeConfig || initializeAppConfig();
}
