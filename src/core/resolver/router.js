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
import {logInfo} from "@/utils/logger";
const ChatPage = () =>
  import(/* webpackChunkName: "chat-room" */ "@/views/ChatPage.vue");
const SwaggerPage = () =>
  import(/* webpackChunkName: "swagger" */ "@/views/SwaggerPage.vue");
const GuidePage = () =>
  import(/* webpackChunkName: "guide" */ "@/views/GuidePage.vue");
const SharedPage = () =>
  import(/* webpackChunkName: "shared" */ "@/views/SharedPage.vue");
const PlaygroundPage = () => import("@/views/playground/PlaygroundPage.vue");
const NotFoundPage = () =>
  import(/* webpackChunkName: "not-found" */ "@/views/NotFoundPage.vue");
const LoginRequiredPage = () => import("@/views/LoginRequiredPage.vue");
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
function shouldRequireAndroidUpdate(appInfo) {
  if (!isAndroidApp(appInfo)) return false;
  const currentVersion = appInfo?.appVersion;
  const latestVersion = appInfo?.lastVersionInfo?.version;
  if (!currentVersion || !latestVersion) return false;

  return isVersionLowerThan(currentVersion, latestVersion);
}
function shouldCheckAuth(to) {
  if (!ENABLE_AUTH_GUARD) return false;

  if (to.meta?.skipAuthCheck) return false;

  return to.matched.some((record) => record.meta?.requireAuth);
}
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
function debugRouteGuard(...args) {
  if (ENABLE_AUTH_GUARD_DEBUG) {
    logInfo("[route-guard]", ...args);
  }
}
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
        requireAuth
      );
    }

    return normalizedRoute;
  });
}
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

    if (requiresAuth) {
      const authResult = await ensureRouteAuthenticated({to, authAxios});

      if (!authResult.authenticated) {
        debugRouteGuard("redirect login-required", authResult);

        return createLoginRequiredRedirect(to, authResult.reason);
      }
    }

    if (!platformStore.isAccess) return true;

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
