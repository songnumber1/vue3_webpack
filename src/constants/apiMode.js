import {getRuntimeSystemSettings} from "@/utils/systemSettingsRuntime";

function normalizeLocalHttpUrl(value) {
  const raw = String(value || "").trim();
  if (!raw) return raw;

  /**
   * 로컬 backend는 application.yml 기준 HTTP 8081로 실행됩니다.
   * .env.local에 https://localhost:8081/api 처럼 남아 있으면 Spring HTTP 포트로
   * TLS handshake가 들어가면서 "HTTP method names must be tokens"가 발생합니다.
   * 운영 HTTPS 도메인에는 영향이 없도록 localhost/127.0.0.1/사설 IP만 HTTP로 보정합니다.
   */
  return raw.replace(
    /^https:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0|192\.168\.\d+\.\d+)(:\d+)?/i,
    "http://$1$2"
  );
}

/**
 * 개발 기본값은 /api 입니다.
 * - npm run serve: vue.config.js proxy가 http://localhost:8081 로 전달
 * - backend에 frontend dist를 올려서 실행: 같은 서버의 /api 호출
 *
 * 직접 backend를 호출해야 할 때만 .env.local에서 아래처럼 변경하세요.
 * VUE_APP_API_BASE_URL=http://localhost:8081/api
 */
export const SERVER_API_BASE_URL = normalizeLocalHttpUrl(
  process.env.VUE_APP_API_BASE_URL || "/api"
);

export function shouldUseServerApi() {
  return getRuntimeSystemSettings().useRealApi === true;
}

export function shouldUseFrontendMockApi() {
  return !shouldUseServerApi();
}
