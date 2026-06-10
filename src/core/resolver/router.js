import {createRouter, createWebHistory} from "vue-router";
import AssistantRouterView from "@/views/AssistantRouterView.vue";
import MainPage from "@/views/MainPage.vue";
import {isAndroidApp} from "@/core/config";
import {isVersionLowerThan} from "@/core/config/version";
import {usePlatformStore} from "@/stores/platformStore";
import {useChatStreamStore} from "@/stores/chatStreamStore";
import {useChatStore} from "@/stores/chatStore";
import {useSystemSettingsStore} from "@/stores/systemSettingsStore";
import {isHiddenConversationUrlMode} from "@/composables/chat/navigation/conversationUrlPolicy";
import {ensureRouteAuthenticated} from "@/core/resolver/authGuard";
import {ENABLE_AUTH_GUARD_DEBUG, AUTH_FAILURE_REASONS} from "@/constants/auth";
import {shouldUseServerApi} from "@/constants/apiMode";
import {ROUTE_NAMES} from "@/constants/routeNames";
import {ROUTE_COMPONENTS} from "@/core/resolver/routeComponents";
import {logInfo} from "@/utils/logger";
import {
  NAVIGATION_LOCK_SCOPES,
  useNavigationLockStore,
} from "@/stores/navigationLockStore";

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
        component: ROUTE_COMPONENTS.ChatPage,
        meta: {title: "Chat"},
      },
      {
        path: "chat/:id",
        name: ROUTE_NAMES.CHAT_DETAIL,
        component: ROUTE_COMPONENTS.ChatPage,
        props: true,
        meta: {title: "Chat"},
      },
      {
        path: "chat-search",
        name: ROUTE_NAMES.CHAT_SEARCH,
        component: ROUTE_COMPONENTS.ChatSearchPage,
        meta: {title: "Chat Search"},
      },
      {
        path: "studio",
        name: ROUTE_NAMES.STUDIO,
        component: ROUTE_COMPONENTS.StudioPage,
        meta: {title: "Assistant Studio"},
      },
      {
        path: "connector-store",
        name: ROUTE_NAMES.CONNECTOR_STORE,
        component: ROUTE_COMPONENTS.McpConnectorListPage,
        meta: {title: "Connector Store"},
      },
      {
        path: "swagger",
        name: ROUTE_NAMES.SWAGGER,
        component: ROUTE_COMPONENTS.SwaggerPage,
        meta: {title: "Swagger"},
      },
      {
        path: "guide",
        name: ROUTE_NAMES.GUIDE,
        component: ROUTE_COMPONENTS.GuidePage,
        meta: {title: "Guide"},
      },
      {
        path: "shared",
        name: ROUTE_NAMES.SHARED,
        component: ROUTE_COMPONENTS.SharedPage,
        meta: {title: "Shared Chat", skipAuthCheck: true},
      },
      {
        path: "shared/:id",
        name: ROUTE_NAMES.SHARED_ENTRY,
        component: ROUTE_COMPONENTS.SharedPage,
        props: true,
        meta: {title: "Shared Chat", skipAuthCheck: true},
      },
      {
        path: "playground",
        name: ROUTE_NAMES.PLAYGROUND,
        component: ROUTE_COMPONENTS.PlaygroundPage,
        meta: {title: "Playground"},
      },
    ],
  },
];

const legalRoutes = [
  {
    path: "/terms",
    name: ROUTE_NAMES.TERMS,
    component: ROUTE_COMPONENTS.TermsPage,
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
    component: ROUTE_COMPONENTS.LoginRequiredPage,
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
    component: ROUTE_COMPONENTS.AndroidUpdate,
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

function isAllowedHistoryLockNavigation({to, from, chatStore, settings}) {
  const pendingHistoryId = String(chatStore.pendingSelectedChatId || "").trim();

  // Allow the internal route that opens the currently pending chat.
  if (pendingHistoryId) {
    const isPendingVisibleChatRoute =
      to.name === ROUTE_NAMES.CHAT_DETAIL &&
      String(to.params?.id || "") === pendingHistoryId;
    const isPendingHiddenChatRoute =
      to.name === ROUTE_NAMES.CHAT_ENTRY &&
      isHiddenConversationUrlMode(settings);

    return isPendingVisibleChatRoute || isPendingHiddenChatRoute;
  }

  if (to.fullPath && from?.fullPath && to.fullPath === from.fullPath) {
    return true;
  }

  // Allow /shared/:id -> /shared after a valid shared room is confirmed.
  if (
    from?.name === ROUTE_NAMES.SHARED_ENTRY &&
    to.name === ROUTE_NAMES.SHARED &&
    chatStore.isActiveSharedRoom
  ) {
    return true;
  }

  // Allow shared-not-found flow to leave the shared route and return to main.
  if (
    (from?.name === ROUTE_NAMES.SHARED_ENTRY ||
      from?.name === ROUTE_NAMES.SHARED) &&
    to.name === ROUTE_NAMES.MAIN &&
    !chatStore.isActiveSharedRoom
  ) {
    return true;
  }

  return false;
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

function guardStreamingNavigation(to, chatStreamStore) {
  if (!chatStreamStore.isStreaming) return true;
  return chatStreamStore.consumeAllowedNavigation(to) ? true : false;
}

function guardHistoryNavigation({
  to,
  from,
  chatStore,
  settings,
  navigationLockStore,
}) {
  if (!navigationLockStore.isLocked(NAVIGATION_LOCK_SCOPES.chatHistory)) {
    return true;
  }
  return isAllowedHistoryLockNavigation({to, from, chatStore, settings})
    ? true
    : false;
}

function guardSharedRoute(to, chatStore) {
  // /shared is valid only after /shared/:id has confirmed an active shared room.
  if (to.name === ROUTE_NAMES.SHARED && !chatStore.isActiveSharedRoom) {
    return {name: ROUTE_NAMES.MAIN, replace: true};
  }
  return true;
}

function guardConversationUrlMode({to, chatStore, chatStreamStore, settings}) {
  const hiddenMode = isHiddenConversationUrlMode(settings);

  if (!hiddenMode && to.name === ROUTE_NAMES.CHAT_ENTRY) {
    return {name: ROUTE_NAMES.MAIN, replace: true};
  }

  if (
    hiddenMode &&
    to.name === ROUTE_NAMES.CHAT_ENTRY &&
    !(
      chatStore.activeRoomType === "chat" &&
      String(chatStore.activeRoomId || "").trim()
    ) &&
    !String(chatStore.pendingSelectedChatId || "").trim() &&
    !chatStreamStore.isStreaming
  ) {
    return {name: ROUTE_NAMES.MAIN, replace: true};
  }

  if (hiddenMode && to.name === ROUTE_NAMES.CHAT_DETAIL) {
    return {name: ROUTE_NAMES.MAIN, replace: true};
  }

  return true;
}

async function guardAuth({to, authAxios}) {
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

  const authResult = await ensureRouteAuthenticated({to, authAxios});
  if (authResult.authenticated) return true;

  debugRouteGuard("redirect login-required", authResult);
  return createLoginRequiredRedirect(to, authResult.reason);
}

function guardVersion({to, platformStore, appInfo}) {
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
  const {authAxios} = context;

  router.beforeEach(async (to, from) => {
    const platformStore = usePlatformStore();
    const chatStreamStore = useChatStreamStore();
    const chatStore = useChatStore();
    const systemSettingsStore = useSystemSettingsStore();
    const navigationLockStore = useNavigationLockStore();

    platformStore.refresh(appInfo);

    // Logout/update routes must not be blocked by chat locks.
    if (isRouteGuardBypassRoute(to)) return true;

    const guardResults = [
      guardStreamingNavigation(to, chatStreamStore),
      guardHistoryNavigation({
        to,
        from,
        chatStore,
        settings: systemSettingsStore.settings,
        navigationLockStore,
      }),
      guardSharedRoute(to, chatStore),
      guardConversationUrlMode({
        to,
        chatStore,
        chatStreamStore,
        settings: systemSettingsStore.settings,
      }),
      await guardAuth({to, authAxios}),
      guardVersion({to, platformStore, appInfo}),
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

  const router = createRouter({history: createWebHistory(), routes});
  registerRouteGuard(router, appInfo, context);

  return router;
}
