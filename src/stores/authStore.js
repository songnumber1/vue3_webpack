/**
 * @file stores/authStore.js
 * @description Pinia 전역 상태 저장소입니다. 화면 간 공유되어야 하는 business/runtime 상태를 관리합니다.
 *
 * 프리징 코드 주석 기준:
 * - 이 주석은 코드 추적을 돕기 위한 설명이며 런타임 동작을 변경하지 않습니다.
 * - 함수/상태가 다른 composable, store, component로 전달되는 경우 호출 방향을 먼저 확인하세요.
 */

import {defineStore} from "pinia";

/**
 * @description 사용자 인증 세션, 인프라 접근 토큰 스냅샷, 내부 사내 지식 데이터베이스(RAG) 검색 인가 권한을 총괄 통제하는 스토어입니다.
 */
export const useAuthStore = defineStore("auth", {
  // 인증 도메인 보안 상태 구조 정의
  state: () => ({
    accessInfo: null, // 서버 게이트웨이 인증 패킷의 원시 구조체 데이터
    user: null, // 사내 임직원 식별 정보 스냅샷 레코드
    isRagAuth: false, // 사내 내부 문서 정보 통합 검색 인프라 접근 승인 여부
    sourceOptions: [], // 권한에 입각하여 열람 가능한 마스터 지식 소스 카테고리 배열
    externalOptions: [], // 연동 권한이 승인된 외부 엔드포인트 연동 옵션 풀
    authChecked: false, // 게이트웨이 통신을 통해 최소 1회 이상 토큰 무결성 검증을 마쳤는지 판단하는 플래그
    isAuthenticated: false, // 현재 사용자 세션의 실시간 유효 인가 통과 상태 플래그
    authFailureReason: null, // 인증 거부 혹은 파기 처리가 발생했을 때 마킹되는 표준 시스템 사유 키
    authErrorMessage: "", // 화면 UI 단에 직관적으로 퍼뜨릴 로그인 에러 텍스트 스트링
  }),
  getters: {
    // 임직원 성명 정보 추출용 단순 게터
    userName: (state) => state.user?.userName || "",
    // 유저 고유 ID 식별 코드 임포트 게터
    userId: (state) => state.user?.userId || "",
  },
  actions: {
    /**
     * @function setAccessInfo
     * @description 수임된 토큰 원시 인증 데이터 패킷을 해체하여 내부 세부 가용 권한 어레이 및 상태창으로 파싱 분기 이식합니다.
     * @param {object} accessInfo - 게이트웨이 인증 결과 스냅샷 구조체
     */
    setAccessInfo(accessInfo = {}) {
      this.accessInfo = accessInfo || null;
      this.user = accessInfo?.user || null;
      this.isRagAuth = Boolean(accessInfo?.isRagAuth); // 명시적 형변환을 통한 불리언 가드 보안 적용
      this.sourceOptions = accessInfo?.sourceOptions || [];
      this.externalOptions = accessInfo?.externalOptions || [];
    },

    /**
     * @function setAuthenticatedAccessInfo
     * @description 토큰 세션이 최종 완벽 마운트 및 정상 유효 패스 상태임을 공식 공표 승인 처리합니다.
     * @param {object} accessInfo - 검증을 통과 완료한 마스터 인가 객체
     */
    setAuthenticatedAccessInfo(accessInfo = {}) {
      this.setAccessInfo(accessInfo); // 데이터 기반 주입 수립
      this.authChecked = true; // 검증 스케줄 마감 마킹
      this.isAuthenticated = true; // 세션 정상 점등 공표
      this.authFailureReason = null; // 장애 사유 로그 비우기
      this.authErrorMessage = ""; // 에러 스트링 클리어
    },

    /**
     * @function setAuthFailure
     * @description 계정 정지, 토큰 만료 등 정상적인 비즈니스 로직 플로우 상에서 세션 거부 처리가 확정되었을 때 발동됩니다.
     * @param {string} reason - 토큰 거부 차단 표준 키 (예: 'TOKEN_EXPIRED')
     * @param {object} accessInfo - 제한적 열람 권한만 부여받은 더미 혹은 잔존 액세스 객체
     */
    setAuthFailure(reason, accessInfo = {}) {
      this.setAccessInfo(accessInfo);
      this.authChecked = true; // 검증 모션 자체는 완료됨 마킹
      this.isAuthenticated = false; // 인가 등급 소등 (접근 차단 가드 활성화)
      this.authFailureReason = reason; // 차단 귀책 사유 마킹
      this.authErrorMessage = ""; // 일반 시스템 에러 문구 비우기
    },

    /**
     * @function setAuthError
     * @description 네트워크 크래시, 핸드셰이크 인프라 타임아웃 등 기술적 무효 사태로 로그인 프로세스가 공중 분해되었을 때 사태를 격리 리셋합니다.
     * @param {Error|object} error - 프론트 또는 미들웨어 단에서 파싱된 오류 소스
     */
    setAuthError(error) {
      // 보안 유실 방지를 위해 기존 인가 정보 버퍼들을 단 한 장도 남김없이 완전 무효 리셋 소거합니다.
      this.accessInfo = null;
      this.user = null;
      this.isRagAuth = false;
      this.sourceOptions = [];
      this.externalOptions = [];

      this.authChecked = true; // 검증 모션 클로즈 마킹
      this.isAuthenticated = false; // 미인가 처리 고정 lock
      this.authFailureReason = "AUTH_ERROR"; // 인프라 장애 귀책 사유 박기
      this.authErrorMessage =
        error?.message || "[authStore] Login verification failed."; // 유저 경고 메시지 맵 마운팅
    },

    /**
     * 로그아웃 전역 이벤트를 수신하여 세션 데이터 소스를 공장 초기화 규격으로 완전 백업 청소 리셋합니다.
     */
    resetAuth() {
      this.accessInfo = null;
      this.user = null;
      this.isRagAuth = false;
      this.sourceOptions = [];
      this.externalOptions = [];
      this.authChecked = false;
      this.isAuthenticated = false;
      this.authFailureReason = null;
      this.authErrorMessage = "";
    },
  },
});
