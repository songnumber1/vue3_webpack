import {httpClient} from "@/api/clients/httpClient";
import {API_ENDPOINTS} from "@/constants/apiEndpoints";

// 모듈 의존성을 모두 불러온 뒤, 아래에서 화면 상태와 실행 로직을 구성합니다.
/**
 * @description getAssistants 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {void} voidParam - 별도 입력값 없이 실행됩니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
async function getAssistants() {
  const response = await httpClient.get(API_ENDPOINTS.ASSISTANT_INFO);
  // 계산된 결과를 호출부로 반환합니다.
  return response?.data || [];
}

/**
 * @description getStudios 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {void} voidParam - 별도 입력값 없이 실행됩니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
async function getStudios() {
  const response = await httpClient.get(API_ENDPOINTS.STUDIO_INFO);
  // 계산된 결과를 호출부로 반환합니다.
  return response?.data || [];
}

export const assistantApiLive = {getAssistants, getStudios};
