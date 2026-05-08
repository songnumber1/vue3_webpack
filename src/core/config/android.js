import { RUN_ENV, PLATFORM } from './constants'
import { createId } from '@/utils/id'

function readAndroidValue(bridge, methodName, fallback = null) {
  try {
    const value = bridge?.[methodName]?.()
    return value == null || value === '' ? fallback : String(value)
  } catch {
    return fallback
  }
}

export function createAndroidConfig(bridge = window.AndroidBridge) {
  return {
    env: RUN_ENV.NATIVE,
    platform: PLATFORM.ANDROID,
    appVersion: readAndroidValue(bridge, 'getAppVersion', '1.0.0'),
    appBuildVersion: readAndroidValue(bridge, 'getAppBuildVersion', '1'),
    bridgeVersion: readAndroidValue(bridge, 'getBridgeVersion', '1.0.0'),
    token: readAndroidValue(bridge, 'getToken', createId('app')),
    deviceId: readAndroidValue(bridge, 'getDeviceId', null)
  }
}
