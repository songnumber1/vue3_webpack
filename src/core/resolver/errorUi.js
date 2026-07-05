/**
 * @file core/resolver/errorUi.js
 * @description 앱 초기화와 resolver 연결을 담당하는 core 계층입니다.
 */

import {isNativeApp} from "@/core/config/appConfig";

/**
 * @typedef {object} ErrorUIStrategy
 * @property {function(string): void} notify - 시스템 내부 에러 메시지를 수신하여 각 플랫폼 환경에 최적화된 형태로 사용자 또는 개발자에게 전파하는 알림 인터페이스 메서드
 */

/**
 * @description 애플리케이션 초기화 시점에 현재 구동 컨텍스트를 판별하여, 전역 인프라 에러 및 검증 실패 메시지를 화면에 출력해줄 다형성(Polymorphism) 기반의 에러 알림 UI 전략 객체를 동적 조합 및 반환합니다.
 * @param {object} appInfo - core/config 단에서 탐색이 완료되어 넘어온 앱의 환경 설정 및 OS 스냅샷 객체
 * @param {object} bridge - core/resolver/bridge 단에서 결정되어 하향 주입된 네이티브 하드웨어 제어/더미 브릿지 인스턴스
 * @returns {ErrorUIStrategy} 공통 규격 핸들러가 장착되어 즉시 가동 가능한 에러 UI 전략 매핑 객체
 */
export function resolveErrorUI(appInfo, bridge) {
  // [분기 1순위: 하이브리드 네이티브 앱 환경인 경우]
  if (isNativeApp(appInfo)) {
    return {
      /**
       * @description 하드웨어 고유 제어권을 활용하여 모바일 OS 네이티브 토스트(Toast) 알림 창으로 에러 메시지를 깔끔하게 띄워줍니다.
       * @param {string} message 사용자에게 시각적으로 노출할 에러 본문 텍스트
       */
      notify(message) {
        // 옵셔널 체이닝(`?.`) 가드를 통해 주입받은 브릿지나 토스트 메서드가 부재한 비정상 국면에서도 런타임 크래시가 나지 않도록 방어 조치 후 하드웨어 알림 트리거
        bridge?.toast?.(message);
      },
    };
  }

  // [분기 2순위: 일반 PC/모바일 웹 브라우저 환경인 경우 (기본값 폴백)]
  return {
    /**
     * @description 웹 브라우저 환경에서는 무분별한 alert 팝업으로 유저 인터랙션을 파괴하지 않고, 사내 모니터링 시스템이나 개발자 도구 콘솔창에 안전하게 경고 로그로 우회 적재합니다.
     * @param {string} message 디버깅용 에러 본문 텍스트
     */
    notify(message) {
      void message;
    },
  };
}
