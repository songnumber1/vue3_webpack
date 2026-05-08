import axios from 'axios'
import { isAndroidApp, isIosApp } from '@/core/config'

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

const iosOverride = {
  timeout: 20000,
  headers: {
    'X-Client-Platform': 'ios-webview'
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

export function resolveAxios(appInfo) {
  const override = isAndroidApp(appInfo)
    ? androidOverride
    : isIosApp(appInfo)
      ? iosOverride
      : webOverride

  return axios.create(mergeConfig(baseConfig, override))
}
