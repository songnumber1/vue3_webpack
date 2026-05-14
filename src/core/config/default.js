/**
 * @file default.js
 * @description JavaScript module used by the Vue application runtime.
 * @author OpenAI
 */

import { RUN_ENV, PLATFORM } from "./constants";
import { createId } from "@/utils/id";

/**
 * createDefaultConfig 함수입니다.
 * @param {*} platform 함수 실행에 필요한 값입니다.
 * @returns {*} 처리 결과를 반환합니다.
 */
export function createDefaultConfig(platform = PLATFORM.UNKNOWN) {
  return {
    env: RUN_ENV.BROWSER,
    platform,
    appVersion: "1.0.0",
    appBuildVersion: "1.0.0",
    bridgeVersion: "1.0.0",
    token: createId("app"),
    deviceId: null,
  };
}
