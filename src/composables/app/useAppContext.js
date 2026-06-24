/**
 * @file composables/app/useAppContext.js
 * @description Vue Composition API 기반 상태/행동 분리 모듈입니다. UI 컴포넌트의 복잡도를 낮추기 위해 사용됩니다.
 */

import {inject} from "vue";

/**
 * Vue 컴포넌트 트리 하부에서 전역 애플리케이션 콘텍스트(`appContext`)를 안전하게 추출하여 반환하는 커스텀 컴포지션 훅입니다.
 * 컨텍스트가 주입되지 않은 비정상적인 환경(예: 독립적인 컴포넌트 테스트 등)에서 호출될 경우 런타임 에러를 발생시켜 디버깅을 돕습니다.
 * @returns {Object} 부트스트랩 시점에 제공된 전역 핵심 인프라 인스턴스 집합 객체
 * @throws {Error} `appContext`가 상위 컨텍스트에 존재하지 않거나 provide 되지 않았을 경우 발생
 * @see {@link bootstrap} 전역 `appContext`를 공식적으로 생성하고 제공(`app.provide`)하는 프론트엔드 진입점 함수
 */
export function useAppContext() {
  // Vue의 의존성 주입(DI) 시스템을 활용하여 최상위 레이어에서 주입한 'appContext' 식별자 자원을 가로챕니다.
  const context = inject("appContext");

  // 만약 주입된 context가 null이거나 undefined라면, 올바른 생명주기 밖에서 호출되었거나 부트스트랩 단계가 누락된 것이므로 예외를 발생시킵니다.
  if (!context) throw new Error("appContext is not provided.");

  // 검증을 통과한 안전한 상태의 애플리케이션 콘텍스트 객체(bridge, storage, api, axios 등)를 최종 반환합니다.
  return context;
}
