/**
 * @file composables/progress/useProgressOverlay.js
 * @description 코드에서 명시적으로 전역 ProgressBar 표시를 요청할 수 있는 작은 래퍼입니다.
 */

import {useApiRequestStore} from "@/stores/apiRequestStore";

export function useProgressOverlay() {
  const progressStore = useApiRequestStore();

  function start() {
    progressStore.startProgress();
  }

  function stop() {
    progressStore.stopProgress();
  }

  async function run(task) {
    start();
    try {
      return await task();
    } finally {
      stop();
    }
  }

  return {
    start,
    stop,
    run,
  };
}
