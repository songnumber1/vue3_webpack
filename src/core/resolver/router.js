import {createRouter, createWebHistory} from "vue-router";
import AssistantRoot from "@/views/AssistantRoot.vue";
import MainPage from "@/views/MainPage.vue";
import {isAndroidApp, isIosApp} from "@/core/config";
import {isVersionLowerThan} from "@/core/config/version";
import {usePlatformStore} from "@/stores/platformStore";
import {ensureRouteAuthenticated} from "@/core/resolver/authGuard";
import {
  ENABLE_AUTH_GUARD,
  ENABLE_AUTH_GUARD_DEBUG,
  AUTH_FAILURE_REASONS,
} from "@/constants/auth";

const ChatPage = () =>
  import(/* webpackChunkName: "chat-room" */ "@/views/ChatPage.vue");
const SwaggerPage = () =>
  import(/* webpackChunkName: "swagger" */ "@/views/SwaggerPage.vue");
const GuidePage = () =>
  import(/* webpackChunkName: "guide" */ "@/views/GuidePage.vue");
const SharedPage = () =>
  import(/* webpackChunkName: "shared" */ "@/views/SharedPage.vue");
const PlaygroundPage = () =>
  import(
    /* webpackChunkName: "playground" */ "@/views/playground/PlaygroundPage.vue"
  );
const NotFoundPage = () =>
  import(/* webpackChunkName: "not-found" */ "@/views/NotFoundPage.vue");
const LoginRequiredPage = () =>
  import(
    /* webpackChunkName: "login-required" */ "@/views/LoginRequiredPage.vue"
  );
const AndroidUpdate = () =>
  import(
    /* webpackChunkName: "android-update" */ "@/views/android/AndroidUpdate.vue"
  );

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
 * Android 앱의 강제 업데이트 필요 여부를 판단합니다.
 *
 * @param {object} appInfo - resolveAppConfig에서 생성된 앱 정보입니다.
 * @returns {boolean} 강제 업데이트 라우트로 이동해야 하는지 여부입니다.
 */
function shouldRequireAndroidUpdate(appInfo) {
  if (!isAndroidApp(appInfo)) return false;
  const currentVersion = appInfo?.appVersion;
  const latestVersion = appInfo?.lastVersionInfo?.version;
  if (!currentVersion || !latestVersion) return false;
  return isVersionLowerThan(currentVersion, latestVersion);
}

/**
 * 상위 route record의 meta.requireAuth를 포함해 인증 필요 여부를 판단합니다.
 *
 * @param {import('vue-router').RouteLocationNormalized} to - 이동 대상 라우트입니다.
 * @returns {boolean} 로그인 확인이 필요한 라우트인지 여부입니다.
 */
function shouldCheckAuth(to) {
  if (!ENABLE_AUTH_GUARD) return false;

  if (to.meta?.skipAuthCheck) return false;

  return to.matched.some((record) => record.meta?.requireAuth);
}

/**
 * 로그인 확인 실패 시 로그인 필요 안내 화면으로 이동할 route location을 생성합니다.
 *
 * @param {import('vue-router').RouteLocationNormalized} to - 원래 이동하려던 라우트입니다.
 * @param {string} reason - LOGIN_REQUIRED, ACCESS_DENIED, USER_AGREE_REQUIRED, AUTH_ERROR 등의 사유입니다.
 * @returns {object} vue-router redirect location입니다.
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
 * 라우터 인증 가드 디버그 로그를 출력합니다.
 *
 * @param {...*} args - console.info로 출력할 값입니다.
 * @returns {void}
 */
function debugRouteGuard(...args) {
  if (ENABLE_AUTH_GUARD_DEBUG) {
    console.info("[route-guard]", ...args);
  }
}

/**
 * 부모 route record의 requireAuth 값을 children meta에 명시적으로 전파합니다.
 *
 * 특징:
 * - vue-router의 to.matched 검사만으로도 부모 meta는 상속 판정 가능하지만,
 *   개발자가 Vue Devtools/route config에서 children meta를 확인할 때도 requireAuth가 보이도록 보강합니다.
 * - 직접 URL 입력 시에도 beforeEach에서 to.matched 기준으로 동일하게 동작합니다.
 *
 * @param {Array<object>} routes - route config 배열입니다.
 * @param {boolean} inheritedRequireAuth - 상위 route의 requireAuth 여부입니다.
 * @returns {Array<object>} requireAuth가 명시 전파된 route config 배열입니다.
 */
function applyInheritedRequireAuth(routes, inheritedRequireAuth = false) {
  return routes.map((route) => {
    const ownMeta = route.meta || {};
    const requireAuth = Boolean(ownMeta.requireAuth || inheritedRequireAuth);
    const normalizedRoute = {
      ...route,
      meta: requireAuth ? {...ownMeta, requireAuth: true} : ownMeta,
    };

    if (Array.isArray(route.children)) {
      normalizedRoute.children = applyInheritedRequireAuth(
        route.children,
        requireAuth,
      );
    }

    return normalizedRoute;
  });
}

/**
 * vue-router 전역 가드를 등록합니다.
 *
 * method: beforeEach / afterEach
 * payload: route location, appInfo, authAxios
 * response: 인증/버전 상태에 따라 라우트 이동 허용 또는 redirect location 반환
 *
 * @param {import('vue-router').Router} router - Vue Router 인스턴스입니다.
 * @param {object} appInfo - resolveAppConfig에서 생성된 앱 정보입니다.
 * @param {object} context - 라우터 가드에 필요한 외부 의존성입니다.
 * @param {import('axios').AxiosInstance} context.authAxios - 로그인 확인 전용 axios 인스턴스입니다.
 * @returns {void}
 */
function registerRouteGuard(router, appInfo, context = {}) {
  const {authAxios} = context;

  router.beforeEach(async (to) => {
    const platformStore = usePlatformStore();
    platformStore.refresh(appInfo);

    if (!platformStore.isAccess) return true;

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
    });

    if (requiresAuth) {
      const authResult = await ensureRouteAuthenticated({to, authAxios});

      if (!authResult.authenticated) {
        debugRouteGuard("redirect login-required", authResult);
        return createLoginRequiredRedirect(to, authResult.reason);
      }
    }

    if (to.meta?.skipVersionCheck) return true;
    if (to.name === ANDROID_UPDATE_ROUTE_NAME) return true;
    if (shouldRequireAndroidUpdate(appInfo))
      return {name: ANDROID_UPDATE_ROUTE_NAME, replace: true};
    return true;
  });
  router.afterEach((to) => {
    if (to.meta?.title) document.title = to.meta.title;
  });
}

/**
 * 애플리케이션 라우터를 생성합니다.
 *
 * 특징:
 * - path: '/' route record에 requireAuth: true를 부여합니다.
 * - children route는 to.matched 기반으로 부모 인증 정책을 자동 상속합니다.
 * - 로그인 확인은 공통 axios가 아닌 authAxios로 access/info.do를 호출합니다.
 *
 * @param {object} appInfo - resolveAppConfig에서 생성된 앱 정보입니다.
 * @param {object} context - 라우터 생성에 필요한 의존성입니다.
 * @param {import('axios').AxiosInstance} context.authAxios - 로그인 확인 전용 axios 인스턴스입니다.
 * @returns {import('vue-router').Router} Vue Router 인스턴스입니다.
 */
export function resolveRouter(appInfo, context = {}) {
  const routes = applyInheritedRequireAuth([
    ...baseRoutes,
    ...authRoutes,
    ...(isAndroidApp(appInfo) ? androidRoutes : []),
    ...(isIosApp(appInfo) ? iosRoutes : []),
    notFoundRoute,
  ]);
  const router = createRouter({history: createWebHistory(), routes});
  registerRouteGuard(router, appInfo, context);
  return router;
}
