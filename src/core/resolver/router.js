import {createRouter, createWebHashHistory} from "vue-router";
import AssistantRouterView from "@/views/AssistantRouterView.vue";
import MainPage from "@/views/MainPage.vue";
import {isAndroidApp} from "@/core/config/appConfig";
import {isVersionLowerThan} from "@/core/config/version";
import {usePlatformStore} from "@/stores/platformStore";
import {useChatStreamStore} from "@/stores/chatStreamStore";
import {useChatStore} from "@/stores/chatStore";
import {resolveConversationEntryGuard} from "@/composables/chat/chatRoomActions";
import {ensureRouteAuthenticated} from "@/core/resolver/authGuard";
import {ENABLE_AUTH_GUARD_DEBUG, AUTH_FAILURE_REASONS} from "@/constants/auth";
import {shouldUseServerApi} from "@/constants/apiMode";
import {ROUTE_NAMES} from "@/constants/routeNames";
import {logInfo} from "@/utils/logger";

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
const LoginRequiredPage = () =>
  import(
    /* webpackChunkName: "login-required" */ "@/views/LoginRequiredPage.vue"
  );
const AndroidUpdate = () =>
  import(
    /* webpackChunkName: "android-update" */ "@/views/android/AndroidUpdate.vue"
  );
const TermsPage = () =>
  import(/* webpackChunkName: "terms" */ "@/views/TermsPage.vue");

const baseRoutes = [
  {
    path: "/",
    component: AssistantRouterView,
    meta: {requireAuth: true},
    children: [
      {
        path: "",
        alias: "main",
        name: ROUTE_NAMES.MAIN,
        component: MainPage,
        meta: {title: "Assistant"},
      },
      {
        path: "chat",
        name: ROUTE_NAMES.CHAT_ENTRY,
        component: ChatPage,
        meta: {title: "Chat"},
      },
      {
        path: "chat/:id",
        name: ROUTE_NAMES.CHAT_DETAIL,
        component: ChatPage,
        props: true,
        meta: {title: "Chat"},
      },
      {
        path: "share-chat/:id",
        name: ROUTE_NAMES.SHARE_CHAT_ENTRY,
        component: ChatPage,
        props: true,
        meta: {title: "Chat"},
      },
      {
        path: "chat-search",
        name: ROUTE_NAMES.CHAT_SEARCH,
        component: ChatSearchPage,
        meta: {title: "Chat Search"},
      },
      {
        path: "studio",
        name: ROUTE_NAMES.STUDIO,
        component: StudioPage,
        meta: {title: "Assistant Studio"},
      },
      {
        path: "connector-store",
        name: ROUTE_NAMES.CONNECTOR_STORE,
        component: McpConnectorListPage,
        meta: {title: "Connector Store"},
      },
      {
        path: "swagger",
        name: ROUTE_NAMES.SWAGGER,
        component: SwaggerPage,
        meta: {title: "Swagger"},
      },
      {
        path: "guide",
        name: ROUTE_NAMES.GUIDE,
        component: GuidePage,
        meta: {title: "Guide"},
      },
      {
        path: "shared",
        name: ROUTE_NAMES.SHARED,
        component: SharedPage,
        meta: {title: "Shared Chat", skipAuthCheck: true},
      },
      {
        path: "shared/:id",
        name: ROUTE_NAMES.SHARED_ENTRY,
        component: SharedPage,
        props: true,
        meta: {title: "Shared Chat", skipAuthCheck: true},
      },
      {
        path: "playground",
        name: ROUTE_NAMES.PLAYGROUND,
        component: PlaygroundPage,
        meta: {title: "Playground"},
      },
    ],
  },
];

const legalRoutes = [
  {
    path: "/terms",
    name: ROUTE_NAMES.TERMS,
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
    path: "/login",
    alias: "/login-required",
    name: ROUTE_NAMES.LOGIN_REQUIRED,
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
    name: ROUTE_NAMES.ANDROID_UPDATE,
    component: AndroidUpdate,
    meta: {
      title: "Android Update",
      skipAuthCheck: true,
      skipVersionCheck: true,
    },
  },
];

const fallbackRoute = {
  path: "/:pathMatch(.*)*",
  redirect: {name: ROUTE_NAMES.MAIN},
};

function shouldRequireAndroidUpdate(appInfo) {
  if (!isAndroidApp(appInfo)) return false;
  const currentVersion = appInfo?.appVersion;
  const latestVersion = appInfo?.lastVersionInfo?.version;
  if (!currentVersion || !latestVersion) return false;
  return isVersionLowerThan(currentVersion, latestVersion);
}

function shouldCheckAuth(to) {
  if (!shouldUseServerApi()) return false;
  if (to.meta?.skipAuthCheck) return false;
  return to.matched.some((record) => record.meta?.requireAuth);
}

function createLoginRequiredRedirect(to, reason) {
  return {
    name: ROUTE_NAMES.LOGIN_REQUIRED,
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

function isRouteGuardBypassRoute(to = {}) {
  return (
    to.name === ROUTE_NAMES.LOGIN_REQUIRED ||
    to.name === ROUTE_NAMES.ANDROID_UPDATE
  );
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

function guardStreamingNavigation(to) {
  const chatStreamStore = useChatStreamStore();
  if (!chatStreamStore.isWait) return true;
  return chatStreamStore.consumeAllowedNavigation(to) ? true : false;
}

function guardSharedRoute(to) {
  const chatStore = useChatStore();
  // /shared is valid only after /shared/:id has confirmed an active shared room.
  if (to.name === ROUTE_NAMES.SHARED && !chatStore.isActiveSharedRoom) {
    return {name: ROUTE_NAMES.MAIN, replace: true};
  }
  return true;
}

function guardHiddenConversationEntry(to) {
  return resolveConversationEntryGuard(to);
}

async function guardAuth(to, axios) {
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
  });

  if (!requiresAuth) return true;

  const authResult = await ensureRouteAuthenticated(to, axios);
  if (authResult.authenticated) return true;

  debugRouteGuard("redirect login-required", authResult);
  return createLoginRequiredRedirect(to, authResult.reason);
}

function guardVersion(to, appInfo) {
  const platformStore = usePlatformStore();
  if (!platformStore.isAccess) return true;
  if (to.meta?.skipVersionCheck) return true;
  if (to.name === ROUTE_NAMES.ANDROID_UPDATE) return true;

  if (shouldRequireAndroidUpdate(appInfo)) {
    return {name: ROUTE_NAMES.ANDROID_UPDATE, replace: true};
  }

  return true;
}

function resolveGuardResult(result) {
  return result === true ? null : result;
}

function registerRouteGuard(router, appInfo, context = {}) {
  const {axios} = context;

  router.beforeEach(async (to) => {
    const platformStore = usePlatformStore();

    platformStore.refresh(appInfo);

    // Logout/update routes must not be blocked by chat locks.
    if (isRouteGuardBypassRoute(to)) return true;

    const guardResults = [
      guardStreamingNavigation(to),
      guardSharedRoute(to),
      guardHiddenConversationEntry(to),
      await guardAuth(to, axios),
      guardVersion(to, appInfo),
    ];

    for (const result of guardResults) {
      const resolved = resolveGuardResult(result);
      if (resolved !== null) return resolved;
    }

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
    fallbackRoute,
  ]);

  const router = createRouter({history: createWebHashHistory(), routes});
  registerRouteGuard(router, appInfo, context);

  return router;
}
