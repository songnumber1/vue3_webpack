/**
 * @file core/config/extension.js
 * @description 앱 초기화와 resolver 연결을 담당하는 core 계층입니다.
 */

import {RUN_ENV, PLATFORM} from "./constants";
import {createId} from "@/utils/id";

export function createExtensionConfig(platform = PLATFORM.UNKNOWN) {
  return {
    env: RUN_ENV.EXTENSION,
    platform,
    appVersion: "extension",
    appBuildVersion: "extension",
    bridgeVersion: null,
    token: createId("app"),
    deviceId: null,
  };
}
