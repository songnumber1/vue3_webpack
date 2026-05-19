function readBooleanEnv(value, fallback = false) {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }

  return ["true", "1", "yes", "y"].includes(String(value).toLowerCase());
}

/**
 * true  : backend API 사용
 * false : frontend mock API 사용
 */
export const isServerAPI = readBooleanEnv(
  process.env.VUE_APP_IS_SERVER_API,
  true
);

/**
 * 개발 기본값은 /api 입니다.
 * - npm run serve: vue.config.js proxy가 http://localhost:8081 로 전달
 * - backend에 frontend dist를 올려서 실행: 같은 서버의 /api 호출
 *
 * 직접 backend를 호출해야 할 때만 .env.local에서 아래처럼 변경하세요.
 * VUE_APP_API_BASE_URL=http://localhost:8081/api
 */
export const SERVER_API_BASE_URL = process.env.VUE_APP_API_BASE_URL || "/api";

export function shouldUseServerApi() {
  return isServerAPI === true;
}

export function shouldUseFrontendMockApi() {
  return !shouldUseServerApi();
}
