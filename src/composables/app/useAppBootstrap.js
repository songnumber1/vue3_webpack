/**
 * @file composables/app/useAppBootstrap.js
 * @description AppContainer 기준의 앱 공통 bootstrap 상태를 단일 진입점으로 관리합니다.
 *
 * 이 composable은 access/info, assistant/model, prompt template, chat history 등
 * 최초 화면 구성에 필요한 데이터를 한 번만 조회하고 관련 Pinia store에 반영합니다.
 */

import {bootstrapAppRuntime} from "@/composables/app/appRuntimeBootstrap";
import {useAppRuntimeStore} from "@/stores/appRuntimeStore";
import {useAssistantStore} from "@/stores/assistantStore";
import {useAuthStore} from "@/stores/authStore";
import {useChatStore} from "@/stores/chatStore";

let initializePromise = null;
let initializeGeneration = 0;

/**
 * App 공통 bootstrap을 시작하거나 이미 진행 중인 동일 promise를 재사용합니다.
 * AppContainer와 ChatContainer가 동시에 호출해도 실제 API bundle은 한 번만 실행됩니다.
 */
export function resetAppBootstrapState() {
  initializeGeneration += 1;
  initializePromise = null;

  try {
    useAppRuntimeStore().resetRuntime();
  } catch (_storeError) {
    // Pinia 초기화 전 또는 테스트 환경에서는 reset 요청을 무시합니다.
  }
}

export function useAppBootstrap() {
  const appRuntimeStore = useAppRuntimeStore();
  const authStore = useAuthStore();
  const assistantStore = useAssistantStore();
  const chatStore = useChatStore();

  async function initialize() {
    if (appRuntimeStore.initialized) return true;
    if (initializePromise) return initializePromise;

    const requestGeneration = initializeGeneration;

    appRuntimeStore.startLoading();

    initializePromise = bootstrapAppRuntime({
      accessInfoOverride: authStore.isAuthenticated
        ? authStore.accessInfo || null
        : null,
    })
      .then((data) => {
        if (requestGeneration !== initializeGeneration) return data;
        if (data.accessInfo?.user) {
          authStore.setAuthenticatedAccessInfo(data.accessInfo);
        } else {
          authStore.setAccessInfo(data.accessInfo);
        }

        assistantStore.setBootstrapData(data);
        chatStore.setHistories(data.chatHistories);

        appRuntimeStore.finishLoading();
        return data;
      })
      .catch((error) => {
        if (requestGeneration === initializeGeneration) {
          appRuntimeStore.fail(error);
        }
        throw error;
      })
      .finally(() => {
        if (requestGeneration === initializeGeneration) {
          initializePromise = null;
        }
      });

    return initializePromise;
  }

  async function ensureInitialized() {
    if (appRuntimeStore.initialized) return true;
    return initialize();
  }

  return {
    initialize,
    ensureInitialized,
  };
}
