/**
 * @file composables/app/useAppBootstrap.js
 * @description AppContainer 기준의 앱 공통 bootstrap 상태를 단일 진입점으로 관리합니다.
 *
 * 이 composable은 access/info, assistant/model, prompt template, chat history 등
 * 최초 화면 구성에 필요한 데이터를 한 번만 조회하고 관련 Pinia store에 반영합니다.
 */

import {bootstrapAppRuntime} from "@/composables/app/appRuntimeBootstrap";
import {useAppRuntimeStore} from "@/stores/appRuntimeStore";
import {
  clearAppBootstrapPromise,
  getAppBootstrapGeneration,
  getAppBootstrapPromise,
  setAppBootstrapPromise,
} from "@/composables/app/appBootstrapState";
import {useAuthStore} from "@/stores/authStore";
import {useChatStore} from "@/stores/chatStore";

/**
 * App 공통 bootstrap을 시작하거나 이미 진행 중인 동일 promise를 재사용합니다.
 * AppContainer와 ChatContainer가 동시에 호출해도 실제 API bundle은 한 번만 실행됩니다.
 */

export function useAppBootstrap() {
  const appRuntimeStore = useAppRuntimeStore();
  const authStore = useAuthStore();
    const chatStore = useChatStore();

  async function initialize() {
    if (appRuntimeStore.initialized) return true;
    const activePromise = getAppBootstrapPromise();
    if (activePromise) return activePromise;

    const requestGeneration = getAppBootstrapGeneration();

    appRuntimeStore.startLoading();

    const initializePromise = bootstrapAppRuntime({
      accessInfoOverride: authStore.isAuthenticated
        ? authStore.accessInfo || null
        : null,
    })
      .then((data) => {
        if (requestGeneration !== getAppBootstrapGeneration()) return data;
        if (data.accessInfo?.user) {
          authStore.setAuthenticatedAccessInfo(data.accessInfo);
        } else {
          authStore.setAccessInfo(data.accessInfo);
        }

        chatStore.setBootstrapData(data);
        chatStore.setChatRooms(data.chatHistories);

        appRuntimeStore.finishLoading();
        return data;
      })
      .catch((error) => {
        if (requestGeneration === getAppBootstrapGeneration()) {
          appRuntimeStore.fail(error);
        }
        throw error;
      })
      .finally(() => {
        clearAppBootstrapPromise(requestGeneration);
      });

    setAppBootstrapPromise(initializePromise);
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
