/**
 * @file core/bootstrap.js
 * @description 앱 초기화와 resolver 연결을 담당하는 core 계층입니다.
 *
 * 프리징 코드 주석 기준:
 * - 이 주석은 코드 추적을 돕기 위한 설명이며 런타임 동작을 변경하지 않습니다.
 * - 함수/상태가 다른 composable, store, component로 전달되는 경우 호출 방향을 먼저 확인하세요.
 */

import {createApp} from "vue";
import {createPinia} from "pinia";
import {usePlatformStore} from "@/stores/platformStore";
import {useViewportStore} from "@/stores/viewportStore";
import App from "@/App.vue";
import {resolveAppConfig} from "@/core/config";
import {resolveLayout} from "@/core/resolver/layout";
import {resolveAxios} from "@/core/resolver/axios";
import {resolveAuthAxios} from "@/core/resolver/authAxios";
import {applyInterceptors} from "@/core/resolver/interceptor";
import {resolveApi} from "@/core/resolver/api";
import {resolveRouter} from "@/core/resolver/router";
import {resolveBridge} from "@/core/resolver/bridge";
import {resolveStorage} from "@/core/resolver/storage";
import {resolveTheme} from "@/core/resolver/theme";
import {resolveErrorUI} from "@/core/resolver/errorUi";
import {resolveUploadStrategy} from "@/core/resolver/upload";
import {i18n} from "@/i18n";
import {installViewportModeClass} from "@/platform/viewport/viewportMode";
import {logWarn} from "@/utils/logger";

/**
 * 애플리케이션의 모든 전역 상태, 네트워크 환경, 플랫폼 모듈 및 설정을
 * 순차적으로 조율(Orchestration)하여 앱을 최종 구동하는 비동기 진입점 함수입니다.
 * @returns {Promise<void>}
 * @see {@link resolveAppConfig} 플랫폼 전역 초기화 설정을 파싱하는 함수
 * @see {@link createAndroidConfig} 내부의 resolveBridge를 통해 안드로이드인 경우 네이티브 설정을 연동합니다.
 */
export async function bootstrap() {
  // 1. 현재 화면 크기를 추적하여 HTML/Body 태그에 모바일/데스크톱 대응용 CSS 클래스(예: .is-mobile)를 동적으로 삽입합니다.
  installViewportModeClass();

  // 2. 현재 실행 환경(운영체제, 빌드 환경, 모바일 브레이크포인트 등)의 메타 설정 정보를 빌드 시스템으로부터 읽어옵니다.
  const appInfo = resolveAppConfig();

  // 3. 네이티브 환경(Android 등)일 경우 웹뷰 브릿지 채널을 연결하고, 데스크톱 브라우저인 경우 폴백 모킹 인터페이스를 초기화합니다.
  const bridge = resolveBridge(appInfo);

  // 4. 로컬 스토리지 또는 세션 스토리지 인터페이스를 구성합니다. 하이브리드 앱 환경일 경우 네이티브 저장소를 경유하도록 브릿지를 주입합니다.
  const storage = resolveStorage(appInfo, bridge);

  // 5. 사용자가 이전에 설정한 다크모드/라이트모드 등의 테마 설정을 스토리지 인스턴스로부터 읽어와 전역 테마 엔진을 설정합니다.
  const theme = resolveTheme(storage);

  // 6. 일반 공통 API 통신에 사용할 표준 HTTP 비동기 통신 라이브러리(Axios) 기본 인스턴스를 생성합니다.
  const axios = resolveAxios(appInfo);

  // 7. 토큰 갱신(Refresh) 및 유저 인증 헤더가 자동 주입되는 보안/인증 전용 HTTP 비동기 통신(Axios) 인스턴스를 별도로 분리 생성합니다.
  const authAxios = resolveAuthAxios(appInfo);

  // 8. 전역 모달, 토스트 알림 등 애플리케이션 수준의 하위 공통 에러 UI 레이어를 플랫폼 명세에 맞게 생성합니다.
  const errorUI = resolveErrorUI(appInfo, bridge);

  // 9. 현재 기기 환경에 맞춰 네트워크 대역폭 손실을 최소화할 수 있는 업로드 프로토콜 인프라(Chunked/Form) 전략을 구성합니다.
  const upload = resolveUploadStrategy(appInfo, axios, bridge);

  // 10. 생성된 기본 HTTP 인스턴스에 네트워크 요청/응답 시 브릿지 연동 및 에러 UI 팝업을 가로챌 전역 인터셉터들을 주입합니다.
  applyInterceptors(axios, appInfo, {bridge, errorUI});

  // 11. 가공 완료된 HTTP 인스턴스들을 바탕으로 프론트엔드 비즈니스 로직(Service/Repository 레이어)에서 직접 호출할 API 명세 집합을 빌드합니다.
  const api = resolveApi(appInfo, axios);

  // 12. 라우팅 전환 시 인증 인스턴스(`authAxios`)를 검증하여 페이지 접근 권한을 판단하는 클라이언트 라우터 설정을 로드합니다.
  const router = resolveRouter(appInfo, {authAxios});

  // 13. 데스크톱, 모바일 뷰포트 상태에 따라 전체적인 뼈대가 될 메인 글로벌 레이아웃 컴포넌트(Layout)를 가동합니다.
  const Layout = resolveLayout(appInfo);

  // 14. Vue.js 프레임워크의 루트 인스턴스(App.vue)를 인스턴스화합니다.
  const app = createApp(App);

  // 15. Vue 내부 컴포넌트의 렌더링/라이프사이클 도중 발생하는 치명적 예외를 전역적으로 수집하는 에러 핸들러를 정의합니다.
  app.config.errorHandler = (error, instance, info) => {
    // 콘솔 창에 경고성 워닝 로그 형태로 발생한 에러 객체와 컴포넌트 인스턴스 위치 정보를 기록합니다.
    logWarn("[bootstrap] vue error:", error, info, instance);
    // 사용자에게 직관적이고 친절한 시스템 알림 토스트 혹은 모달 창을 전역 UI 레이어를 통해 송출합니다.
    errorUI?.notify?.("애플리케이션 처리 중 오류가 발생했습니다.");
  };

  // 16. 중앙 집중형 전역 상태 관리 아키텍처인 Pinia 플러그인 인스턴스를 생성합니다.
  const pinia = createPinia();

  // 17. 생성된 Vue 인스턴스에 전역 상태 저장소 시스템(Pinia)을 플러그인으로 등록합니다.
  app.use(pinia);

  // 18. 다국어 지원을 담당하는 국제화 번들 플러그인(i18n)을 애플리케이션에 결합합니다.
  app.use(i18n);

  // 19. 초기화가 완료된 Pinia 환경 위에서 플랫폼 공통 상태 스토어(`usePlatformStore`)를 로드합니다.
  const platformStore = usePlatformStore();
  // 불러온 플랫폼 스토어에 초반에 파싱해 두었던 핵심 앱 메타 설정(`appInfo`)을 동기화하여 전역 상태로 기록합니다.
  platformStore.initialize(appInfo);

  // 20. 해상도 및 모바일 반응형 이벤트를 중앙 제어하는 뷰포트 스토어(`useViewportStore`)를 로드합니다.
  const viewportStore = useViewportStore();
  // 설정 정보에 정의된 모바일 브레이크포인트 임계값 크기를 전달하여 실시간 화면 감지 리스너를 실행시킵니다.
  viewportStore.install({breakpoint: appInfo.mobileBreakpoint});

  // 21. 하이브리드 웹뷰 앱이 완전히 구동되기 전(HTML이 다 파싱되기 이전) 네이티브에서 선제적으로 발생해 임시 대기 배열에 쌓여있던 펜딩 이벤트가 있다면,
  if (
    typeof window !== "undefined" &&
    Array.isArray(window.__pendingNativeEvents)
  ) {
    // 대기 배열의 첫 번째 요소부터 순차적으로 잘라내어(Splice) 스토어 레지스트리에 네이티브 고유 이벤트들을 영구 기록 처리합니다.
    window.__pendingNativeEvents.splice(0).forEach((event) => {
      platformStore.recordNativeEvent(event.type, event.payload);
    });
  }

  // 22. 컴포넌트 트리 하부 깊숙한 곳에서도 `inject` 문법만으로 부트스트랩 리소스들을 손쉽게 꺼내 쓸 수 있도록 콘텍스트 객체를 전역 주입(Provide)합니다.
  app.provide("appContext", {
    appInfo,
    platform: appInfo.platform,
    env: appInfo.env,
    bridge,
    storage,
    theme,
    axios,
    authAxios,
    api,
    errorUI,
    upload,
    platformStore,
  });

  // 23. 전역 범위에서 분기 처리 없이 레이아웃의 틀을 교체할 수 있도록 `<AppLayout />` 이라는 명칭의 전역 컴포넌트로 공식 등록합니다.
  app.component("AppLayout", Layout);

  // 24. 페이지 전환 및 주소 네비게이션을 담당하는 라우터 플러그인을 최종 주입합니다.
  app.use(router);

  // 25. 모든 구성 인터페이스 조립이 완결되었으므로 public/index.html 파일 내 아이디가 `app`인 DOM 루트 노드에 프론트엔드 결과물을 마운트합니다.
  app.mount("#app");
}
