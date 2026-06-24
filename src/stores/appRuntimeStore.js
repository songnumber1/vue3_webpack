/**
 * @file stores/appRuntimeStore.js
 * @description Pinia 전역 상태 저장소입니다. 화면 간 공유되어야 하는 business/runtime 상태를 관리합니다.
 */

import {defineStore} from "pinia";

/**
 * @description 애플리케이션의 글로벌 구동 상태(초기화 여부, 로딩 세션, 런타임 에러)를 관장하는 시스템 핀아 스토어입니다.
 */
export const useAppRuntimeStore = defineStore("appRuntime", {
  // 스토어의 원시 상태 정의 영역
  state: () => ({
    initialized: false, // 코어 인프라 자원의 부트스트랩 완료 여부
    loading: false, // 전역 차원의 블로킹 데이터 로딩 플래그
    error: null, // 크래시 발생 시 적치되는 런타임 에러 객체
  }),
  actions: {
    /**
     * 전역 로딩 세션을 개시하고 기존에 잔존하던 에러 버퍼를 깔끔하게 지웁니다.
     */
    startLoading() {
      this.loading = true; // 로딩 점등
      this.error = null; // 에러 초기화
    },
    /**
     * 로딩 세션을 마감하고 애플리케이션의 코어 부트스트랩 수립 완료 상태를 마킹합니다.
     */
    finishLoading() {
      this.loading = false; // 로딩 소등
      this.initialized = true; // 초기화 완결 마킹
    },
    /**
     * 시스템 구동 단계에서 치명적 장애가 전파되었을 때 상태를 캐치하여 가드 처리합니다.
     * @param {Error|object} error - 발생한 오류 인스턴스 또는 메시지 객체
     */
    fail(error) {
      this.loading = false; // 로딩 강제 종료
      this.error = error; // 에러 객체 적치
    },
    /**
     * 인증 세션 변경 또는 강제 로그아웃 시 앱 부트스트랩 상태를 초기화합니다.
     */
    resetRuntime() {
      this.initialized = false;
      this.loading = false;
      this.error = null;
    },
  },
});
