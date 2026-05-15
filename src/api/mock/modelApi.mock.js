/**
 * @file modelApi.mock.js
 * @description JavaScript module for modelApi.mock.
 */

import { MODELS_RAW } from '@/data/raw/models.raw'
import { STUDIO_MODELS_RAW } from '@/data/raw/studioModels.raw'
import { resolveMock } from './mockUtils'

export const modelApiMock = {
  getModels() {
    return resolveMock(MODELS_RAW, 170)
  },
  getStudioModels() {
    return resolveMock(STUDIO_MODELS_RAW, 190)
  },
}
