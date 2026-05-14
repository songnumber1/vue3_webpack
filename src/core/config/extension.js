/**
 * @file extension.js
 * @description JavaScript module used by the Vue application runtime.
 * @author OpenAI
 */

import { RUN_ENV, PLATFORM } from "./constants";
import { createId } from "@/utils/id";

/**
 * createExtensionConfig 함수입니다.
 * @param {*} platform 함수 실행에 필요한 값입니다.
 * @returns {*} 처리 결과를 반환합니다.
 */
export function createExtensionConfig(platform = PLATFORM.UNKNOWN) {
  return {
    env: RUN_ENV.EXTENSION,
    platform,
    appVersion: "extension",
    appBuildVersion: "extension",
    bridgeVersion: null,
    token: createId("app"),
    deviceId: null
  };
}
