export const ROUTE_COMPONENTS = Object.freeze({
  ChatPage: () =>
    import(/* webpackChunkName: "chat-room" */ "@/views/ChatPage.vue"),
  SwaggerPage: () =>
    import(/* webpackChunkName: "swagger" */ "@/views/SwaggerPage.vue"),
  GuidePage: () =>
    import(/* webpackChunkName: "guide" */ "@/views/GuidePage.vue"),
  SharedPage: () =>
    import(/* webpackChunkName: "shared" */ "@/views/SharedPage.vue"),
  PlaygroundPage: () =>
    import(
      /* webpackChunkName: "playground" */ "@/views/playground/PlaygroundPage.vue"
    ),
  StudioPage: () =>
    import(/* webpackChunkName: "studio" */ "@/views/studio/StudioPage.vue"),
  McpConnectorListPage: () =>
    import(
      /* webpackChunkName: "connector-store" */ "@/views/mcp/McpConnectorListPage.vue"
    ),
  ChatSearchPage: () =>
    import(
      /* webpackChunkName: "chat-search" */ "@/views/search/ChatSearchPage.vue"
    ),
  LoginRequiredPage: () =>
    import(
      /* webpackChunkName: "login-required" */ "@/views/LoginRequiredPage.vue"
    ),
  AndroidUpdate: () =>
    import(
      /* webpackChunkName: "android-update" */ "@/views/android/AndroidUpdate.vue"
    ),
  TermsPage: () =>
    import(/* webpackChunkName: "terms" */ "@/views/TermsPage.vue"),
});
