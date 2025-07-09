// src/router/iframe.js
import { createRouter, createWebHashHistory } from "vue-router";
import IframeChat from "@/views/IframeChat.vue";

const routes = [{ path: "/", component: IframeChat }];

export default createRouter({
  history: createWebHashHistory(),
  routes,
});
