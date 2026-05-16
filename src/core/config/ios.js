import {RUN_ENV, PLATFORM} from "./constants";
import {createId} from "@/utils/id";

/**
 * createIosConfig 함수입니다.
 * @returns {*} 처리 결과를 반환합니다.
 */
export function createIosConfig() {
  return {
    env: RUN_ENV.NATIVE,
    platform: PLATFORM.IOS,
    appVersion: "1.0.0",
    appBuildVersion: "1",
    bridgeVersion: "1.0.0",
    token: createId("app"),
    deviceId: null,
  };
}
