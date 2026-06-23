/**
 * @file composables/app/appBootstrapState.js
 * @description App bootstrap 진행 상태와 reset 함수를 hook wrapper와 분리해 관리합니다.
 */

import {useAppRuntimeStore} from "@/stores/appRuntimeStore";

let initializePromise = null;
let initializeGeneration = 0;

export function getAppBootstrapGeneration() {
  return initializeGeneration;
}

export function getAppBootstrapPromise() {
  return initializePromise;
}

export function setAppBootstrapPromise(promise) {
  initializePromise = promise;
}

export function clearAppBootstrapPromise(requestGeneration) {
  if (requestGeneration === initializeGeneration) {
    initializePromise = null;
  }
}

export function resetAppBootstrapState() {
  initializeGeneration += 1;
  initializePromise = null;

  try {
    useAppRuntimeStore().resetRuntime();
  } catch (_storeError) {
    // Pinia 초기화 전 또는 테스트 환경에서는 reset 요청을 무시합니다.
  }
}
