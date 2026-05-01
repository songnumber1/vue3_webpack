import axios from 'axios'

const baseConfig = {
  baseURL: process.env.VUE_APP_API_BASE_URL || '/api',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json'
  }
}

const androidOverride = {
  timeout: 20000,
  headers: {
    'X-Client-Platform': 'android-webview'
  }
}

const webOverride = {
  headers: {
    'X-Client-Platform': 'web'
  }
}

function mergeConfig(base, override) {
  return {
    ...base,
    ...override,
    headers: {
      ...(base.headers || {}),
      ...(override.headers || {})
    }
  }
}

export function resolveAxios(platform) {
  const override = platform === 'android' ? androidOverride : webOverride
  return axios.create(mergeConfig(baseConfig, override))
}
