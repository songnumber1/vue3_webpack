import {inject} from "vue";

/**
 * useAppContext 함수입니다.
 * @returns {*} 처리 결과를 반환합니다.
 */
export function useAppContext() {
  const context = inject("appContext");
  if (!context) throw new Error("appContext is not provided.");
  return context;
}
