import {RUN_ENV, PLATFORM} from "./constants";
import {createId} from "@/utils/id";

// 모듈 의존성을 모두 불러온 뒤, 아래에서 화면 상태와 실행 로직을 구성합니다.
/**
 * @description createDefaultConfig 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {*} platform - platform 입력값입니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
export function createDefaultConfig(platform = PLATFORM.UNKNOWN) {
  // 계산된 결과를 호출부로 반환합니다.
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
