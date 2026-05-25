import {RUN_ENV, PLATFORM} from "./constants";
import {createId} from "@/utils/id";

/**
 * 앱 업데이트가 필요할 때 클라이언트에 노출할 기본 경고 정보 메시지 상수를 정의합니다.
 * 객체 변형을 방지하기 위해 `Object.freeze`로 동결 상태를 유지합니다.
 */
export const LAST_VERSION_INFO = Object.freeze({
  /** 최소 요구되는 기준 앱 버전 */
  version: "1.0.0",
  /** 알림 팝업 창의 제목 */
  title: "앱 업데이트가 필요합니다.",
  /** 알림 팝업 창의 세부 안내 본문 내용 */
  message:
    "현재 앱 버전에서는 최신 웹 기능을 사용할 수 없습니다. 앱을 업데이트한 후 다시 실행해 주세요.",
});

/**
 * 안드로이드 웹뷰 Bridge 객체로부터 특정 메서드 또는 프로퍼티의 값을 안전하게 읽어옵니다.
 * @param {Object} bridge - 전역 `window.AndroidBridge` 등의 네이티브 연동 객체
 * @param {string} methodName - 브릿지 객체에서 호출하거나 조회할 타깃 멤버 이름
 * @param {*} [fallback=null] - 에러가 발생하거나 값이 유효하지 않을 때 반환할 기본 대입값
 * @returns {string|null} 조회된 데이터의 문자열 형태 결과 또는 대체(Fallback) 값
 */
function readAndroidValue(bridge, methodName, fallback = null) {
  try {
    // 주입된 브릿지 객체로부터 전달받은 이름에 매칭되는 내부 멤버(함수 혹은 프로퍼티)를 참조합니다.
    const member = bridge?.[methodName];

    // 해당 멤버의 타입이 함수(메서드) 형태라면 `.call()`을 통해 안전하게 실행하고, 단순 프로퍼티라면 값을 그대로 가져옵니다.
    const value = typeof member === "function" ? member.call(bridge) : member;

    // 최종 파싱된 결과가 null, undefined이거나 빈 문자열("")인 경우 폴백 값을 반환하고, 정상적인 값이라면 최종적으로 String 타입으로 변환하여 반환합니다.
    return value == null || value === "" ? fallback : String(value);
  } catch {
    // 자바스크립트와 자바(네이티브) 인터페이스 간 인터프리팅 도중 예상치 못한 런타임 에러 발생 시 지정된 대체(Fallback) 값을 반환합니다.
    return fallback;
  }
}

/**
 * 안드로이드 네이티브 앱 브릿지 데이터를 통합 수집하여 프론트엔드 전역에서 활용할 규격화된 안드로이드 설정 객체를 생성합니다.
 * @param {Object} [bridge=window.AndroidBridge] - 안드로이드 앱 인터페이스 객체 (기본값은 전역 윈도우 객체의 AndroidBridge)
 * @returns {Object} 안드로이드 플랫폼 전용 구성(Configuration) 데이터 객체
 * @see {@link readAndroidValue} 네이티브 브릿지에서 데이터를 안전하게 읽어오는 전용 유틸 함수
 * @see {@link LAST_VERSION_INFO} 기본 정의된 강제 업데이트 안내 정보 메타데이터
 */
export function createAndroidConfig(bridge = window.AndroidBridge) {
  return {
    // 현재 애플리케이션의 런타임 환경 유형을 네이티브 하이브리드 모드(NATIVE)로 명시합니다.
    env: RUN_ENV.NATIVE,

    // 현재 실행 베이스가 되는 운영체제 플랫폼을 안드로이드(ANDROID)로 설정합니다.
    platform: PLATFORM.ANDROID,

    // 네이티브 앱의 버전 명칭(예: "1.2.3")을 가져오며, 탐색 실패 시 기본값 "1.0.0"을 설정합니다.
    appVersion: readAndroidValue(bridge, "getAppVersionName", "1.0.0"),

    // 네이티브 앱의 내부 빌드 번호(예: "45")를 가져오며, 탐색 실패 시 기본값 "1"을 설정합니다.
    appBuildVersion: readAndroidValue(bridge, "getAppBuildVersion", "1"),

    // 자바스크립트-네이티브 통신 규격을 정의하는 브릿지 프로토콜 버전을 획득하며, 기본값은 "1.0.0"입니다.
    bridgeVersion: readAndroidValue(bridge, "getBridgeVersion", "1.0.0"),

    // 사용자의 인증 및 세션 검증에 사용될 네이티브 주입 토큰을 가져오며, 없을 경우 고유한 가짜 앱 ID("app-xxxx")를 동적으로 생성하여 대체합니다.
    token: readAndroidValue(bridge, "getToken", createId("app")),

    // 푸시 발송 및 기기 식별을 위한 고유 디바이스 하드웨어 ID를 획득하며, 없을 시 null로 지정합니다.
    deviceId: readAndroidValue(bridge, "getDeviceId", null),

    // 앞서 파일 최상단에 고정해 둔 버전 요구사항 메시지 객체를 그대로 할당합니다.
    lastVersionInfo: LAST_VERSION_INFO,
  };
}
