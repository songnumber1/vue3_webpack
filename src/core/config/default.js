/**
 * @file core/config/default.js
 * @description 앱 초기화와 resolver 연결을 담당하는 core 계층입니다.
 */

import {RUN_ENV, PLATFORM} from "./constants";
import {createId} from "@/utils/id";

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
