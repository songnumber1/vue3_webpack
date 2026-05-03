import {createRouter, createWebHistory} from "vue-router";
import ChatPage from "@/views/ChatPage.vue";
import SwaggerPage from "@/views/SwaggerPage.vue";

const baseRoutes = [
  {path: "/", name: "chat", component: ChatPage, meta: {title: "Chat"}},
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
