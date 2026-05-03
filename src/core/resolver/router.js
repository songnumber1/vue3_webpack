import {createRouter, createWebHistory} from "vue-router";
import ChatPage from "@/views/ChatPage.vue";
import SwaggerPage from "@/views/SwaggerPage.vue";
import BridgePage from "@/views/BridgePage.vue";

const baseRoutes = [
  {path: "/", name: "chat", component: ChatPage, meta: {title: "Chat"}},
  {
    path: "/bridge",
    name: "bridge",
    component: BridgePage,
    meta: {title: "Bridge"},
  },
  {
    path: "/swagger",
    name: "swagger",
    component: SwaggerPage,
    meta: {title: "Swagger"},
  },
  {path: "/:pathMatch(.*)*", redirect: "/"},
];

const androidRoutes = [];

export function resolveRouter(platform) {
  const routes = [
    ...baseRoutes,
    ...(platform === "android" ? androidRoutes : []),
  ];
  return createRouter({history: createWebHistory(), routes});
}
