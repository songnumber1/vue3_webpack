import {createRouter, createWebHistory} from "vue-router";

import MainPage from "@/views/MainPage.vue";
const ChatPage = () => import(/* webpackChunkName: "chat-room" */ "@/views/ChatPage.vue");
const SwaggerPage = () => import(/* webpackChunkName: "swagger" */ "@/views/SwaggerPage.vue");

const NotFoundPage = () => import(/* webpackChunkName: "not-found" */ "@/views/NotFoundPage.vue");

const AndroidUpdate = () => import(/* webpackChunkName: "android-update" */ "@/views/android/AndroidUpdate.vue");

import {isAndroidApp, isIosApp} from "@/core/config";

import {isVersionLowerThan} from "@/core/config/version";

const ANDROID_UPDATE_ROUTE_NAME = "android-update";

/**
 * 공통 라우트
 */
const baseRoutes = [
  {
    path: "/",
    name: "main",
    component: MainPage,
    meta: {
      title: "Assistant",
    },
  },

  {
    path: "/chat/:id",
    name: "chat",
    component: ChatPage,
    props: true,
    meta: {
      title: "Chat",
    },
  },

  {
    path: "/swagger",
    name: "swagger",
    component: SwaggerPage,
    meta: {
      title: "Swagger",
    },
  },
];

/**
 * Android Native 전용 라우트
 */
const androidRoutes = [
  {
    path: "/android/update",
    name: ANDROID_UPDATE_ROUTE_NAME,
    component: AndroidUpdate,

    meta: {
      title: "Android Update",

      /**
       * update 페이지는
       * update check 제외
       */
      skipVersionCheck: true,
    },
  },
];

/**
 * iOS Native 전용 라우트
 */
const iosRoutes = [];

/**
 * 404 라우트
 */
const notFoundRoute = {
  path: "/:pathMatch(.*)*",

  name: "not-found",

  component: NotFoundPage,

  meta: {
    title: "Not Found",

    /**
     * 404는 update redirect 제외
     */
    skipVersionCheck: true,
  },
};

/**
 * Android 업데이트 필요 여부
 *
 * 주의:
 * Android Chrome 브라우저는
 * isAndroidApp()이 false여야 함.
 */
function shouldRequireAndroidUpdate(appInfo) {
  /**
   * Android Native 앱만 대상
   */
  if (!isAndroidApp(appInfo)) {
    return false;
  }

  const currentVersion = appInfo?.appVersion;

  const latestVersion = appInfo?.lastVersionInfo?.version;

  if (!currentVersion || !latestVersion) {
    return false;
  }

  return isVersionLowerThan(currentVersion, latestVersion);
}

/**
 * Router Guard 등록
 */
function registerRouteGuard(router, appInfo) {
  router.beforeEach((to) => {
    /**
     * update check 제외 페이지
     */
    if (to.meta?.skipVersionCheck) {
      return true;
    }

    /**
     * 이미 update 페이지면 통과
     */
    if (to.name === ANDROID_UPDATE_ROUTE_NAME) {
      return true;
    }

    /**
     * Android Native 앱만 update 검사
     */
    if (shouldRequireAndroidUpdate(appInfo)) {
      return {
        name: ANDROID_UPDATE_ROUTE_NAME,

        replace: true,
      };
    }

    return true;
  });

  /**
   * title 처리
   */
  router.afterEach((to) => {
    const title = to.meta?.title;

    if (title) {
      document.title = title;
    }
  });
}

/**
 * Router 생성
 */
export function resolveRouter(appInfo) {
  const routes = [
    ...baseRoutes,

    ...(isAndroidApp(appInfo) ? androidRoutes : []),

    ...(isIosApp(appInfo) ? iosRoutes : []),

    notFoundRoute,
  ];

  const router = createRouter({
    history: createWebHistory(),

    routes,
  });

  registerRouteGuard(router, appInfo);

  return router;
}
