import {inject} from "vue";

// 모듈 의존성을 모두 불러온 뒤, 아래에서 화면 상태와 실행 로직을 구성합니다.
/**
 * @description useAppContext 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {void} voidParam - 별도 입력값 없이 실행됩니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
export function useAppContext() {
  const context = inject("appContext");
  // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
  if (!context) throw new Error("appContext is not provided.");
  // 계산된 결과를 호출부로 반환합니다.
  return context;
}
