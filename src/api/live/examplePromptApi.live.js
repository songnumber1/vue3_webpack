import {httpClient} from "@/api/clients/httpClient";
import {API_ENDPOINTS} from "@/constants/apiEndpoints";

// 모듈 의존성을 모두 불러온 뒤, 아래에서 화면 상태와 실행 로직을 구성합니다.
/**
 * @description getExamplePrompts 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {*} params - params 입력값입니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
async function getExamplePrompts(params = {}) {
  const response = await httpClient.get(API_ENDPOINTS.EXAMPLE_PROMPTS, {
    params,
  });
  // 계산된 결과를 호출부로 반환합니다.
  return response?.data || {list: []};
}

export const examplePromptApiLive = {getExamplePrompts};
