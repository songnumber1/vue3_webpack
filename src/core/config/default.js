import { RUN_ENV, PLATFORM } from './constants'
import { createId } from '@/utils/id'

export function createDefaultConfig(platform = PLATFORM.UNKNOWN) {
  return {
    env: RUN_ENV.BROWSER,
    platform,
    appVersion: 'web',
    appBuildVersion: 'web',
    bridgeVersion: null,
    token: createId('app'),
    deviceId: null
  }
}
