/**
 * @file stores/platformStore.js
 * @description Pinia 전역 상태 저장소입니다. 화면 간 공유되어야 하는 business/runtime 상태를 관리합니다.
 */

import {defineStore} from "pinia";
import {resolveDetailedPlatform} from "@/platform/platformDetector";
import {useSystemSettingsStore} from "@/stores/systemSettingsStore";

/**
 * 하드웨어 장치 설정 스토어의 가상 디바이스 강제 치환 프리셋 상태값을 읽어와
 * 네이티브 플랫폼 계산 함수 측에 하향 상속 연계 주입해주는 중간 추상화 조율 보정식입니다.
 */
function withRuntimePlatformOverride(baseAppInfo = {}) {
  const systemSettingsStore = useSystemSettingsStore();

  return {
    ...baseAppInfo,
    platformOverride: systemSettingsStore.platformOverride, // 디버깅용 장치 강제 에뮬레이팅 오버라이드 식별 키
    mobileBreakpoint: systemSettingsStore.mobileBreakpoint, // 모바일 화면 레이아웃 스위칭용 물리 중단점 수치 해상도 수치
  };
}

/**
 * @description 브라우저 유저 에이전트(User-Agent) 디텍팅, 네이티브 앱 아웃쉘 하이브리드 앱 커넥션 상태,
 * 실시간 하드웨어 네트워크 오프라인 유실 상태 감지를 총괄 조율 보존하는 플랫폼 디바이스 코어 스토어입니다.
 */
export const usePlatformStore = defineStore("platform", {
  // 물리 디바이스 및 하이브리드 소켓 통신 가용성 상태 정보 명세
  state: () => ({
    info: resolveDetailedPlatform(), // 파싱 엔진이 1차 감지 완료해 둔 OS 유형, 브라우저 스펙 등 핵심 정보 구조체
    nativeEvents: [], // AOS 하이브리드 앱 아웃쉘 웹뷰 원격지 채널을 통해 하향 인입된 네이티브 원시 이벤트 버퍼 로그 스택 어레이 (최대 50개 유지 보관)
    lastNativeEvent: null, // 디버그 추적 추적 편의성을 위해 오픈오픈 열어둔 최신 최종 하드웨어 인입 이벤트 패킷 단품
    network: {
      online: typeof navigator === "undefined" ? true : navigator.onLine, // 하드웨어 무선 물리 네트워크 케이블 연결 실시간 가용성 상태 플래그
    },
    pushToken: "", // 모바일 앱 네이티브 인프라로부터 할당 인도받은 FCM/APNS 모바일 전용 푸시 알림 마스터 식별 토큰
    appVersionInfo: null, // 클라이언트 사이드 물리 빌드 버전 스펙 및 심사 상태 메타 구조체 정보
  }),
  getters: {
    // 사내 특수 플랫폼 환경(Access 전용 클라이언트 브라우저 인터페이스) 인입 진입 여부 판별 게터
    isAccess: (state) => state.info.isAccess,
    // 현재 물리 뷰포트 장치 해상도 가이드라인이 모바일 이하 초압축 해상도 컴팩트 화면 규격인지 대조 게터
    isCompactViewport: (state) => state.info.isCompactViewport,
    // 표준 모바일 모바일 브라우저 탭 웹 서핑이 아닌, AOS 전용 래핑 하이브리드 앱 인프라 쉘 내부 런타임 위에서 실제 구동 중인지 가드 판별식
    isNativeRuntime: (state) =>
      state.info.isNativeRuntime || state.info.isNativeApp,
    // 안드로이드 네이티브 전용 앱 빌드 환경 내부 구동 판별 게터
    isAndroidApp: (state) => state.info.isAndroidApp,
    // 스마트폰/태블릿 디바이스 환경의 스몰 모바일 모바일 브라우저 전용 탭 판별 게터
    isMobileBrowser: (state) => state.info.isMobileBrowser,
    // 맥/리눅스를 제외한 일반 데스크톱 PC 마이크로소프트 윈도우 OS 기반의 순수 웹 런타임 진입 여부 판별 게터
    isWindowsWeb: (state) => state.info.isWindows && !state.info.isNativeApp,
  },
  actions: {
    /**
     * @function initialize
     * @description 메인 최상위 App 컴포넌트 부트스트랩 마운트 시점에 원시 기기 장치 명세 데이터를 주입하여 감지 엔진을 빌드 시동합니다.
     * @param {object} baseAppInfo - 최초 수임된 감지 대상 원시 메타 정보 오브젝트
     */
    initialize(baseAppInfo = {}) {
      this.info = resolveDetailedPlatform(
        withRuntimePlatformOverride(baseAppInfo)
      );
      // 네이티브 브라우저 윈도우 객체의 온라인 가용 플래그 정보를 숏서킷 스캔 동기화 마운트
      this.network.online =
        typeof navigator === "undefined" ? true : navigator.onLine;
    },
    /**
     * 시스템 환경 설정 변경(ex: 어드민 페이지에서 강제로 기기 중단점 픽셀 사양을 변경 가공함) 시
     * 플랫폼 엔진 데이터 상태를 수동으로 즉각 정밀 재연산 리프레시 갱신합니다.
     */
    refresh(baseAppInfo = {}) {
      this.info = resolveDetailedPlatform(
        withRuntimePlatformOverride({...this.info, ...baseAppInfo})
      );
    },
    /**
     * 안드로이드/아이폰 디바이스 네이티브 모듈 영역으로부터 수신 연동된 하드웨어 고유 푸시 인가 토큰 주소를 스토어에 잠금 적치합니다.
     */
    setPushToken(token) {
      this.pushToken = token || "";
    },
    /**
     * 스토어 빌드 마스터 및 네이티브 하이브리드 쉘 코어 버전 넘버 명세를 수립 연동 매핑 동기화합니다.
     */
    setAppVersionInfo(data) {
      this.appVersionInfo = data || null;
      if (data?.appVersion) this.info.appVersion = data.appVersion; // 원시 탐색 인포 버전도 최신 스펙으로 하향 패치 수립
    },
    /**
     * @function setNetwork
     * @description 무선 와이파이 단절, 기내 모드 인입 등 장치의 하드웨어 하이브리드 인터넷 망 실시간 가용 탈락 상태 변화 이벤트를 수신 동기화 수립합니다.
     * @param {object} status - 네트워크 원시 링크 정보 상태 스냅샷 패킷
     */
    setNetwork(status = {}) {
      this.network = {...this.network, ...status};
    },
    /**
     * @function recordNativeEvent
     * @description 하이브리드 아웃쉘 브릿지 채널(예: Javascript Interface 버스 파이프라인)을 타고 영영 커널 영역에서 프론트 화면단으로
     * 전파 다운로드 인입된 비동기 네이티브 디바이스 하드웨어 날 것의 이벤트를 유실 없이 가로채 로깅 적치 보존합니다.
     * @param {string} type - 하드웨어 인입 이벤트의 성격 고유 식별 카테고리 태그 (예: 'ON_NETWORK_CHANGE')
     * @param {object} payload - 네이티브 모듈 패킷이 내부적으로 동반 적치 적재해 온 세부 전송 데이터 디테일
     */
    recordNativeEvent(type, payload = {}) {
      const item = {type, payload, receivedAt: new Date().toISOString()};
      this.lastNativeEvent = item; // 디버깅용 원품 갱신 수립

      // 메모리 누수 방어 가드: 히스토리 기록 버퍼 어레이는 최근 타임라인 순으로 누적 적치 스택 빌드하되, 시스템 과부하를 막기 위해 최대 딱 50개 슬롯 한도로 컷 슬라이스 제한 유지합니다.
      this.nativeEvents = [item, ...this.nativeEvents].slice(0, 50);

      // [내부 연쇄 가드 반응형] 네이티브가 하달한 이벤트 명령 키가 물리 인터넷 회선 인프라 망 변경 트랜잭션인 경우 스어 내부 네트워크 상태 액션을 연달아 연쇄 자동 트리거합니다.
      if (type === "ON_NETWORK_CHANGE")
        this.setNetwork(payload.status || payload);
    },
  },
});
