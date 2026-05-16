import {isAndroidApp} from "@/core/config";

// 모듈 의존성을 모두 불러온 뒤, 아래에서 화면 상태와 실행 로직을 구성합니다.
const baseApi = {
  getMe: (http) => http.get("/me"),
  sendMessage: (http, payload) => http.post("/chat/messages", payload),
  getNotices: (http) => http.get("/notices"),
};

const androidApi = {
  sendMessage: (http, payload) => http.post("/app/chat/messages", payload),
};

/**
 * @description resolveApi 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {*} appInfo - appInfo 입력값입니다.
 * @param {*} http - http 입력값입니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
export function resolveApi(appInfo, http) {
  const apiMap = {
    ...baseApi,
    ...(isAndroidApp(appInfo) ? androidApi : {}),
  };

  // 계산된 결과를 호출부로 반환합니다.
  return Object.fromEntries(
    Object.entries(apiMap).map(([name, fn]) => [
      name,
      (...args) => fn(http, ...args),
    ])
  );
}
