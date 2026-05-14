/**
 * @file default.js
 * @description JavaScript module used by the Vue application runtime.
 * @author OpenAI
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
