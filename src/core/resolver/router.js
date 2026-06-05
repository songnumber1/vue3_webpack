/**
 * @file core/resolver/router.js
 * @description 앱 초기화와 resolver 연결을 담당하는 core 계층입니다.
 *
 * 프리징 코드 주석 기준:
 * - 이 주석은 코드 추적을 돕기 위한 설명이며 런타임 동작을 변경하지 않습니다.
 * - 함수/상태가 다른 composable, store, component로 전달되는 경우 호출 방향을 먼저 확인하세요.
 */

import {createRouter, createWebHistory} from "vue-router";
import AssistantRouterView from "@/views/AssistantRouterView.vue";
import MainPage from "@/views/MainPage.vue";
import {isAndroidApp} from "@/core/config";
import {isVersionLowerThan} from "@/core/config/version";
import {usePlatformStore} from "@/stores/platformStore";
import {useChatStreamStore} from "@/stores/chatStreamStore";
import {ensureRouteAuthenticated} from "@/core/resolver/authGuard";
import {ENABLE_AUTH_GUARD_DEBUG, AUTH_FAILURE_REASONS} from "@/constants/auth";
import {shouldUseServerApi} from "@/constants/apiMode";
import {logInfo} from "@/utils/logger";

// 초기 번들 크기 최적화를 위해 컴포넌트들을 Webpack Chunk 지정을 통해 비동기 지연 로딩(Lazy Loading) 처리합니다.
const ChatPage = () =>
  import(/* webpackChunkName: "chat-room" */ "@/views/ChatPage.vue");
const SwaggerPage = () =>
  import(/* webpackChunkName: "swagger" */ "@/views/SwaggerPage.vue");
const GuidePage = () =>
  import(/* webpackChunkName: "guide" */ "@/views/GuidePage.vue");
const SharedPage = () =>
  import(/* webpackChunkName: "shared" */ "@/views/SharedPage.vue");
const PlaygroundPage = () => import("@/views/playground/PlaygroundPage.vue");
const StudioPage = () =>
  import(/* webpackChunkName: "studio" */ "@/views/studio/StudioPage.vue");
const McpConnectorListPage = () =>
  import(
    /* webpackChunkName: "connector-store" */ "@/views/mcp/McpConnectorListPage.vue"
  );
const ChatSearchPage = () =>
  import(
    /* webpackChunkName: "chat-search" */ "@/views/search/ChatSearchPage.vue"
  );
const NotFoundPage = () =>
  import(/* webpackChunkName: "not-found" */ "@/views/NotFoundPage.vue");
const LoginRequiredPage = () => import("@/views/LoginRequiredPage.vue");
const AndroidUpdate = () => import("@/views/android/AndroidUpdate.vue");
const TermsPage = () =>
  import(/* webpackChunkName: "terms" */ "@/views/TermsPage.vue");

// 하드코딩 오류를 방지하기 위해 예외 페이지 이동에 사용될 고유 라우트 네임을 상수로 정의합니다.
const ANDROID_UPDATE_ROUTE_NAME = "android-update";
const LOGIN_REQUIRED_ROUTE_NAME = "login-required";

/**
 * @type {Array<import('vue-router').RouteRecordRaw>}
 * @description 인증(requireAuth)이 기본적으로 필요한 서비스 메인 및 서브 서비스 핵심 기능 라우트 트리입니다.
 */
const baseRoutes = [
  {
    path: "/",
    component: AssistantRouterView,
    meta: {requireAuth: true}, // 자식 라우트들에게 인증 필요 속성을 전파하기 위한 마킹
    children: [
      {
        path: "",
        alias: "main",
        name: "main",
        component: MainPage,
        meta: {title: "Assistant"},
      },
      {
        path: "chat",
        name: "chat-entry",
        component: ChatPage,
        meta: {title: "Chat"},
      },
      {
        path: "chat/:id",
        name: "chat",
        component: ChatPage,
        props: true, // 패스 파라미터 :id를 컴포넌트의 props로 주입
        meta: {title: "Chat"},
      },
      {
        path: "chat-search",
        name: "chat-search",
        component: ChatSearchPage,
        meta: {title: "Chat Search"},
      },
      {
        path: "studio",
        name: "studio",
        component: StudioPage,
        meta: {title: "Assistant Studio"},
      },
      {
        path: "connector-store",
        name: "connector-store",
        component: McpConnectorListPage,
        meta: {title: "Connector Store"},
      },
      {
        path: "swagger",
        name: "swagger",
        component: SwaggerPage,
        meta: {title: "Swagger"},
      },
      {
        path: "guide",
        name: "guide",
        component: GuidePage,
        meta: {title: "Guide"},
      },
      {
        path: "shared/:shareId",
        name: "shared",
        component: SharedPage,
        props: true,
        meta: {title: "Shared Chat"},
      },
      {
        path: "playground",
        name: "playground",
        component: PlaygroundPage,
        meta: {title: "Playground"},
      },
    ],
  },
];

/**
 * @type {Array<import('vue-router').RouteRecordRaw>}
 * @description 약관 및 정책 동의 등 서비스 법적 명세 관련 라우트 세트입니다.
 */
const legalRoutes = [
  {
    path: "/terms",
    name: "terms",
    component: TermsPage,
    meta: {
      title: "Terms of Service",
      requireAuth: true,
      standalone: true, // 네비게이션 LNB/GNB 레이아웃을 제외하고 단독 표시하기 위한 플래그
    },
  },
];

/**
 * @type {Array<import('vue-router').RouteRecordRaw>}
 * @description 미인증 혹은 세션 만료 유저를 격리 수용하기 위한 인증 전용 라우트 세트입니다.
 */
const authRoutes = [
  {
    path: "/login",
    alias: "/login-required",
    name: LOGIN_REQUIRED_ROUTE_NAME,
    component: LoginRequiredPage,
    meta: {
      title: "Login Required",
      skipAuthCheck: true, // 인피니트 리디렉션 무한 루프를 방지하기 위해 인증 검사 제외 처리
      skipVersionCheck: true, // 무조건적인 접근을 허용하기 위해 버전 체크 제외 처리
    },
  },
];

/**
 * @type {Array<import('vue-router').RouteRecordRaw>}
 * @description 안드로이드 네이티브 앱 강제 업데이트 안내 스크린 전용 라우트 세트입니다.
 */
const androidRoutes = [
  {
    path: "/android/update",
    name: ANDROID_UPDATE_ROUTE_NAME,
    component: AndroidUpdate,
    meta: {
      title: "Android Update",
      skipAuthCheck: true,
      skipVersionCheck: true,
    },
  },
];

/**
 * @type {import('vue-router').RouteRecordRaw}
 * @description 잘못된 경로 진입 시 매칭될 와일드카드폴백 (404 Not Found) 라우트 설정입니다.
 */
const notFoundRoute = {
  path: "/:pathMatch(.*)*",
  name: "not-found",
  component: NotFoundPage,
  meta: {title: "Not Found", skipAuthCheck: true, skipVersionCheck: true},
};

/**
 * @description 현재 앱의 빌드 버전과 원격 최신 버전을 비교하여 안드로이드 앱 강제 업데이트가 필요한지 판별합니다.
 * @param {object} appInfo - 플랫폼 스토어 등에서 전달받은 현재 애플리케이션 사양 메타 정보
 * @returns {boolean} 강제 업데이트 대상 여부
 */
/**
 * 이 모듈 내부의 세부 처리 단계입니다. 호출부에서 의미가 드러나지 않는 중간 로직을 캡슐화합니다.
 */
function shouldRequireAndroidUpdate(appInfo) {
  if (!isAndroidApp(appInfo)) return false; // 안드로이드 앱 환경이 아닌 경우 타겟 제외
  const currentVersion = appInfo?.appVersion; // 클라이언트 현재 빌드 버전
  const latestVersion = appInfo?.lastVersionInfo?.version; // 서버 레이어 최신 배포 버전
  if (!currentVersion || !latestVersion) return false; // 정보 유실 시 가드 처리

  // 현재 버전이 최신 요구 버전보다 낮다면 업데이트 대상으로 확정
  return isVersionLowerThan(currentVersion, latestVersion);
}

/**
 * @description 목적지 라우트의 메타데이터와 전역 보안 정책 설정을 대조하여 인증 검사를 수행해야 하는지 판별합니다.
 * @param {import('vue-router').RouteLocationNormalized} to - 이동하고자 하는 목적지 라우트 객체
 * @returns {boolean} 인증 프로세스 진입 여부
 */
/**
 * 이 모듈 내부의 세부 처리 단계입니다. 호출부에서 의미가 드러나지 않는 중간 로직을 캡슐화합니다.
 */
function shouldCheckAuth(to) {
  if (!shouldUseServerApi()) return false; // 시스템 설정의 useRealApi가 false이면 Mock 모드로 간주하여 인증 가드 전체를 스킵

  if (to.meta?.skipAuthCheck) return false; // 라우트 자체에 인증 스킵 메타가 선언되어 있다면 패스

  // 상위 부모 라우트 트리 레코드 중 하나라도 인증(`meta.requireAuth`)을 요구하는지 검사
  return to.matched.some((record) => record.meta?.requireAuth);
}

/**
 * @description 로그인 실패 혹은 세션 부재 시, 기존 목적지 주소를 백업하여 로그인 제한 스크린으로 보내는 리디렉션 옵션 객체를 생성합니다.
 * @param {import('vue-router').RouteLocationNormalized} to - 원래 유저가 진입하려던 목적지 라우트 객체
 * @param {string} reason - 인증 실패 코어 사유 코드
 * @returns {import('vue-router').RouteLocationRaw} Vue Router 변환용 리디렉션 타깃 매핑 오브젝트
 */
/**
 * 호출 흐름에서 재사용할 객체, 상태, context 또는 handler를 생성합니다.
 */
function createLoginRequiredRedirect(to, reason) {
  return {
    name: LOGIN_REQUIRED_ROUTE_NAME,
    query: {
      reason: reason || AUTH_FAILURE_REASONS.LOGIN_REQUIRED, // 구체적인 미인가 사유 주입
      redirect: to.fullPath, // 로그인 완료 후 돌아갈 원본 주소를 쿼리 스트링으로 보존 인터셉트
    },
    replace: true, // 뒤로가기 히스토리 스택에 유효하지 않은 미인증 진입 기록이 남지 않도록 replace 처리
  };
}

/**
 * @description 라우트 가드 디버깅 활성화 플래그 조건에 맞춰 라우팅 흐름 추적 로그를 출력합니다.
 * @param {...any} args - 로그 보드에 출력할 세부 가동 데이터 파라미터 배열
 * @returns {void}
 */
function debugRouteGuard(...args) {
  if (ENABLE_AUTH_GUARD_DEBUG) {
    logInfo("[route-guard]", ...args);
  }
}

/**
 * @description 부모 라우트가 가진 `requireAuth` 필드를 하위 중첩된 모든 자식 라우트 노드들로 재귀 상속 가공합니다.
 * @param {Array<import('vue-router').RouteRecordRaw>} routes - 정규화 가공을 진행할 대상 라우트 목록 배열
 * @param {boolean} [inheritedRequireAuth=false] - 부모 트리 계층으로부터 전파 상속된 인증 조건 플래그
 * @returns {Array<import('vue-router').RouteRecordRaw>} 상속 매핑 및 불변성이 확보된 정규화 라우트 배열 원품
 */
/**
 * 계산된 설정 또는 사용자 선택 값을 실제 상태/DOM에 적용합니다.
 */
function applyInheritedRequireAuth(routes, inheritedRequireAuth = false) {
  return routes.map((route) => {
    const ownMeta = route.meta || {};
    // 자가 메타에 선언되어 있거나 부모로부터 인증 요건을 물려받은 경우 true로 확정
    const requireAuth = Boolean(ownMeta.requireAuth || inheritedRequireAuth);
    const normalizedRoute = {
      ...route,
      meta: requireAuth ? {...ownMeta, requireAuth: true} : ownMeta,
    };

    // 자식 서브 트리가 존재할 경우, 확정된 인증 조건을 인계하여 재귀(Recursive) 호출 단행
    if (Array.isArray(route.children)) {
      normalizedRoute.children = applyInheritedRequireAuth(
        route.children,
        requireAuth
      );
    }

    return normalizedRoute;
  });
}

/**
 * @description 생성된 라우터 인스턴스 레이어에 비즈니스 보안 정책, 스트리밍 가드, 앱 업데이트 검증을 수행할 전가 네비게이션 가드를 주입합니다.
 * @param {import('vue-router').Router} router - 네이티브 뷰 라우터 인스턴스
 * @param {object} appInfo - 애플리케이션 고유 런타임 물리 정보 팩
 * @param {object} [context={}] - Axios 토큰 버스 등 외부 플러그인 의존성 인젝션 컨텍스트
 * @returns {void}
 */
/**
 * 이 모듈 내부의 세부 처리 단계입니다. 호출부에서 의미가 드러나지 않는 중간 로직을 캡슐화합니다.
 */
function registerRouteGuard(router, appInfo, context = {}) {
  const {authAxios} = context;

  // 전역 직전 가드(beforeEach) 파이프라인 개통 수립
  router.beforeEach(async (to) => {
    const platformStore = usePlatformStore();
    const chatStreamStore = useChatStreamStore();

    // 1. 라우트가 전환될 때마다 디바이스 스냅샷 실시간 동기화 리프레시
    platformStore.refresh(appInfo);

    // [중요 비즈니스 방어 가드]
    // AI 답변 스트리밍 중 사용자 이동은 소켓 유실 및 자원 파손을 유발할 수 있어 차단합니다.
    // 단, 새 채팅 생성 직후 프론트가 내부적으로 수행하는 /chat/:id 1회 이동은
    // chatStreamStore.consumeAllowedNavigation(to)로만 통과시킵니다.
    if (
      chatStreamStore.isStreaming &&
      !chatStreamStore.consumeAllowedNavigation(to)
    ) {
      return false;
    }

    // 2. 인증 타겟 스크리닝 연산
    const requiresAuth = shouldCheckAuth(to);
    debugRouteGuard("navigation", {
      path: to.fullPath,
      matched: to.matched.map((record) => ({
        path: record.path,
        requireAuth: Boolean(record.meta?.requireAuth),
        skipAuthCheck: Boolean(record.meta?.skipAuthCheck),
      })),
      useRealApi: shouldUseServerApi(),
      requiresAuth,
      platformAccess: platformStore.isAccess,
    });

    // 3. 인증 인가망 체크 진입 분기
    if (requiresAuth) {
      // 외부 리졸버 인증 함수를 노크하여 토큰 정밀 해독 및 세션 유효성 판별 수행
      const authResult = await ensureRouteAuthenticated({to, authAxios});

      // 미인증 혹은 토큰 만료 판정을 받은 경우 로그인 가이드 스크린으로 강제 유도 격리
      if (!authResult.authenticated) {
        debugRouteGuard("redirect login-required", authResult);

        return createLoginRequiredRedirect(to, authResult.reason);
      }
    }

    // 4. 비지원 기기 가드 점등 시 라우팅 가드를 그대로 보존 바이패스하여 차단 화면을 우선 노출 유도
    if (!platformStore.isAccess) return true;

    // 5. 무조건 오픈 예외 페이지 메타 조건 대조 검사
    if (to.meta?.skipVersionCheck) return true;
    if (to.name === ANDROID_UPDATE_ROUTE_NAME) return true;

    // 6. [안드로이드 전용 버저닝 가드] 버전 비교 연산 수행 후 낮을 시 강제 업데이트 안내 화면으로 납치 리디렉션
    if (shouldRequireAndroidUpdate(appInfo))
      return {name: ANDROID_UPDATE_ROUTE_NAME, replace: true};

    return true; // 상기 전수 보안 및 차단 검문망을 무결하게 통과한 경우 네비게이션 최종 최종 인가 패스
  });

  // 전역 직후 가드(afterEach) 파이프라인 연계 수립
  router.afterEach((to) => {
    // 이동 완료 후 라우트 메타에 등록된 타이틀을 브라우저 브라우저 상단 탭 텍스트 명세에 동기화 매핑
    if (to.meta?.title) document.title = to.meta.title;
  });
}

/**
 * @function resolveRouter
 * @description 전체 도메인 라우트 노드를 정규화 결합하고, 보안 검증 네비게이션 가드를 장착한 확정형 Vue Router 인스턴스를 조립하여 외부 엔진에 컨트리뷰션합니다.
 * @param {object} appInfo - 시스템 코어 빌드 및 최신 버전 메타데이터 명세 구조체
 * @param {object} [context={}] - HTTP Axios 인스턴스 가동 버스 의존성 데이터 세트
 * @returns {import('vue-router').Router} 네비게이션 생명 주기가 주입 완료된 완성형 Vue 라우터 인스턴스 본품
 */
export function resolveRouter(appInfo, context = {}) {
  // 런타임 기기 컨텍스트(안드로이드 하이브리드 앱 여부)에 맞춰 동적으로 배열 결합 및 인증 속성 재귀 상속 구조화 수행
  const routes = applyInheritedRequireAuth([
    ...baseRoutes,
    ...legalRoutes,
    ...authRoutes,
    ...(isAndroidApp(appInfo) ? androidRoutes : []), // 안드로이드 환경이 확인될 경우에만 원본 라우트 풀에 업데이트 전용 노드 가치 결합
    notFoundRoute,
  ]);

  // 히스토리 모드 가동 및 빌드 완료 라우트 구조체를 주입하여 인스턴스 1차 생성
  const router = createRouter({history: createWebHistory(), routes});

  // 코어 보안 감시망 가드 엔진 부착 개통
  registerRouteGuard(router, appInfo, context);

  return router; // 완성 조립품 리턴
}
