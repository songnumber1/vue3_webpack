import {createRouter, createWebHistory} from "vue-router";
import AssistantRoot from "@/views/AssistantRoot.vue";
import MainPage from "@/views/MainPage.vue";
import {isAndroidApp, isIosApp} from "@/core/config";
import {isVersionLowerThan} from "@/core/config/version";
import {usePlatformStore} from "@/stores/platformStore";
import {ensureRouteAuthenticated} from "@/core/resolver/authGuard";
import {
  // 모듈 의존성을 모두 불러온 뒤, 아래에서 화면 상태와 실행 로직을 구성합니다.
  ENABLE_AUTH_GUARD,
  ENABLE_AUTH_GUARD_DEBUG,
  AUTH_FAILURE_REASONS,
} from "@/constants/auth";
import {logInfo} from "@/utils/logger";

/**
 * @description ChatPage 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {void} voidParam - 별도 입력값 없이 실행됩니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
const ChatPage = () =>
  import(/* webpackChunkName: "chat-room" */ "@/views/ChatPage.vue");
/**
 * @description SwaggerPage 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {void} voidParam - 별도 입력값 없이 실행됩니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
const SwaggerPage = () =>
  import(/* webpackChunkName: "swagger" */ "@/views/SwaggerPage.vue");
/**
 * @description GuidePage 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {void} voidParam - 별도 입력값 없이 실행됩니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
const GuidePage = () =>
  import(/* webpackChunkName: "guide" */ "@/views/GuidePage.vue");
/**
 * @description SharedPage 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {void} voidParam - 별도 입력값 없이 실행됩니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
const SharedPage = () =>
  import(/* webpackChunkName: "shared" */ "@/views/SharedPage.vue");
/**
 * @description PlaygroundPage 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {void} voidParam - 별도 입력값 없이 실행됩니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
const PlaygroundPage = () => import("@/views/playground/PlaygroundPage.vue");
/**
 * @description NotFoundPage 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {void} voidParam - 별도 입력값 없이 실행됩니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
const NotFoundPage = () =>
  import(/* webpackChunkName: "not-found" */ "@/views/NotFoundPage.vue");
/**
 * @description LoginRequiredPage 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {void} voidParam - 별도 입력값 없이 실행됩니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
const LoginRequiredPage = () => import("@/views/LoginRequiredPage.vue");
/**
 * @description AndroidUpdate 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {void} voidParam - 별도 입력값 없이 실행됩니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
const AndroidUpdate = () => import("@/views/android/AndroidUpdate.vue");

const TermsPage = () =>
  import(/* webpackChunkName: "terms" */ "@/views/TermsPage.vue");

const ANDROID_UPDATE_ROUTE_NAME = "android-update";
const LOGIN_REQUIRED_ROUTE_NAME = "login-required";

const baseRoutes = [
  {
    path: "/",
    component: AssistantRoot,
    meta: {requireAuth: true},
    children: [
      {path: "", name: "main", component: MainPage, meta: {title: "Assistant"}},
      {
        path: "chat/:id",
        name: "chat",
        component: ChatPage,
        props: true,
        meta: {title: "Chat"},
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

const legalRoutes = [
  {
    path: "/terms",
    name: "terms",
    component: TermsPage,
    meta: {
      title: "Terms of Service",
      requireAuth: true,
      standalone: true,
    },
  },
];
const authRoutes = [
  {
    path: "/login-required",
    name: LOGIN_REQUIRED_ROUTE_NAME,
    component: LoginRequiredPage,
    meta: {
      title: "Login Required",
      skipAuthCheck: true,
      skipVersionCheck: true,
    },
  },
];
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
const iosRoutes = [];
const notFoundRoute = {
  path: "/:pathMatch(.*)*",
  name: "not-found",
  component: NotFoundPage,
  meta: {title: "Not Found", skipAuthCheck: true, skipVersionCheck: true},
};

/**
 * @description shouldRequireAndroidUpdate 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {*} appInfo - appInfo 입력값입니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
function shouldRequireAndroidUpdate(appInfo) {
  // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
  if (!isAndroidApp(appInfo)) return false;
  const currentVersion = appInfo?.appVersion;
  const latestVersion = appInfo?.lastVersionInfo?.version;
  // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
  if (!currentVersion || !latestVersion) return false;

  return isVersionLowerThan(currentVersion, latestVersion);
}

/**
 * @description shouldCheckAuth 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {*} to - to 입력값입니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
function shouldCheckAuth(to) {
  // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
  if (!ENABLE_AUTH_GUARD) return false;

  // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
  if (to.meta?.skipAuthCheck) return false;

  return to.matched.some((record) => record.meta?.requireAuth);
}

/**
 * @description createLoginRequiredRedirect 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {*} to - to 입력값입니다.
 * @param {*} reason - reason 입력값입니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
function createLoginRequiredRedirect(to, reason) {
  return {
    name: LOGIN_REQUIRED_ROUTE_NAME,
    query: {
      reason: reason || AUTH_FAILURE_REASONS.LOGIN_REQUIRED,
      redirect: to.fullPath,
    },
    replace: true,
  };
}

/**
 * @description debugRouteGuard 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {*} args - args 입력값입니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
function debugRouteGuard(...args) {
  // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
  if (ENABLE_AUTH_GUARD_DEBUG) {
    logInfo("[route-guard]", ...args);
  }
}

/**
 * @description applyInheritedRequireAuth 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {*} routes - routes 입력값입니다.
 * @param {*} inheritedRequireAuth - inheritedRequireAuth 입력값입니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
function applyInheritedRequireAuth(routes, inheritedRequireAuth = false) {
  return routes.map((route) => {
    const ownMeta = route.meta || {};
    const requireAuth = Boolean(ownMeta.requireAuth || inheritedRequireAuth);
    const normalizedRoute = {
      ...route,
      meta: requireAuth ? {...ownMeta, requireAuth: true} : ownMeta,
    };

    // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
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
 * @description registerRouteGuard 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {*} router - router 입력값입니다.
 * @param {*} appInfo - appInfo 입력값입니다.
 * @param {*} context - context 입력값입니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
function registerRouteGuard(router, appInfo, context = {}) {
  const {authAxios} = context;

  router.beforeEach(async (to) => {
    const platformStore = usePlatformStore();
    platformStore.refresh(appInfo);

    const requiresAuth = shouldCheckAuth(to);
    debugRouteGuard("navigation", {
      path: to.fullPath,
      matched: to.matched.map((record) => ({
        path: record.path,
        requireAuth: Boolean(record.meta?.requireAuth),
        skipAuthCheck: Boolean(record.meta?.skipAuthCheck),
      })),
      enableAuthGuard: ENABLE_AUTH_GUARD,
      requiresAuth,
      platformAccess: platformStore.isAccess,
    });

    // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
    if (requiresAuth) {
      const authResult = await ensureRouteAuthenticated({to, authAxios});

      // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
      if (!authResult.authenticated) {
        debugRouteGuard("redirect login-required", authResult);

        return createLoginRequiredRedirect(to, authResult.reason);
      }
    }

    // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
    if (!platformStore.isAccess) return true;

    // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
    if (to.meta?.skipVersionCheck) return true;
    // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
    if (to.name === ANDROID_UPDATE_ROUTE_NAME) return true;
    // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
    if (shouldRequireAndroidUpdate(appInfo))
      return {name: ANDROID_UPDATE_ROUTE_NAME, replace: true};

    return true;
  });
  router.afterEach((to) => {
    // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
    if (to.meta?.title) document.title = to.meta.title;
  });
}

/**
 * @description resolveRouter 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {*} appInfo - appInfo 입력값입니다.
 * @param {*} context - context 입력값입니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
export function resolveRouter(appInfo, context = {}) {
  const routes = applyInheritedRequireAuth([
    ...baseRoutes,
    ...legalRoutes,
    ...authRoutes,
    ...(isAndroidApp(appInfo) ? androidRoutes : []),
    ...(isIosApp(appInfo) ? iosRoutes : []),
    notFoundRoute,
  ]);
  const router = createRouter({history: createWebHistory(), routes});
  registerRouteGuard(router, appInfo, context);

  return router;
}
