import {createRouter, createWebHistory} from "vue-router";
import ChatPage from "@/views/ChatPage.vue";
import SwaggerPage from "@/views/SwaggerPage.vue";
import { isAndroidApp, isIosApp } from '@/core/config'

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
const iosRoutes = [];

export function resolveRouter(appInfo) {
  const routes = [
    ...baseRoutes,
    ...(isAndroidApp(appInfo) ? androidRoutes : []),
    ...(isIosApp(appInfo) ? iosRoutes : []),
  ];
  return createRouter({history: createWebHistory(), routes});
}
