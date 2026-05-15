import { ACCESS_INFO_RAW } from '@/data/raw/accessInfo.raw'
import { resolveMock } from './mockUtils'

export const accessApiMock = {
  getAccessInfo(payload = {}) {
    return resolveMock({ ...ACCESS_INFO_RAW, entryType: payload.entryType || ACCESS_INFO_RAW.entryType }, 160)
  },
}
