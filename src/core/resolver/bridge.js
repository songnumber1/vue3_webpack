/**
 * @file core/resolver/bridge.js
 * @description 앱 초기화와 native bridge resolver 연결을 담당하는 core 계층입니다.
 */

import {isAndroidApp} from "@/core/config/appConfig";

/**
 * @description [Null Object 패턴]: 일반 PC/모바일 웹 브라우저 환경에서 실행되어 네이티브 기능 인터페이스가 부재할 때,
 * `window.AndroidBridge.toast()`와 같은 메서드 호출이 스크립트 폭파(Runtime Crash)로 이어지지 않도록 안전 가드를 쳐주는 더미 웹 브릿지 객체입니다.
 */
const noopBridge = {
  getStorage: () => null, // 기기 네이티브 암호화 저장소 요구 시 빈 값 반환 우회
  setStorage: () => {}, // 기기 네이티브 암호화 저장소 적재 명령 무동작 스텁
  toast: (message) => {
    void message;
  },
  requestPermission: () => Promise.resolve(false), // OS 권한(카메라, 마이크 등) 요청 시 웹 환경이므로 즉시 거부(false) 프로미스 반환
  uploadFile: () =>
    // 카메라/파일 가속 업로드는 웹뷰 전용이므로 진입 시 런타임 예외 캐치 큐(Catch Queue)로 에러 객체 투척 처리
    Promise.reject(new Error("Native upload is not available.")),
};

/**
 * @description 시스템 가동 최초 국면에서 현재 구동 컨텍스트를 동적으로 체크하여, 런타임 안전이 확보된 최적의 엑츄에이터 브릿지 인스턴스를 확정 결합(Resolve)해주는 리졸버 함수입니다.
 * @param {object} appInfo - core/config 단에서 환경 변수 및 OS 감지를 완수하고 내려보낸 앱 설정 인프라 데이터 스냅샷
 * @returns {object|typeof noopBridge} 웹 브라우저 및 앱 컴포넌트 전역에서 즉시 바인딩하여 안전하게 구동할 가용 브릿지 핸들러 객체
 */
export function resolveBridge(appInfo) {
  // [엄격한 하이브리드 앱 검증 가드]: OS 및 환경 스냅샷이 '안드로이드 네이티브 앱' 조건과 완벽하게 일치하고,
  // 동시에 안드로이드 자바 코드가 전역 자원으로 주입해 준 실질적 소통 통로인 `window.AndroidBridge` 돔 프로퍼티가 정상 포착될 때에만 기기 제어권 전격 이관
  if (isAndroidApp(appInfo) && window.AndroidBridge)
    return window.AndroidBridge;

  // 위의 특수 하이브리드 앱 상황이 아니라면 일반 크롬, 사파리, 파이어폭스, 혹은 임베디드 웹 화면이므로 시스템 안정을 위해 더미 브릿지 최종 폴백 채택
  return noopBridge;
}
