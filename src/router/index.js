import { createRouter, createWebHistory } from "vue-router";
import ChatView from "@/views/ChatView.vue";
import PlaygroundView from "@/views/PlaygroundView.vue";

export default createRouter({
  history: createWebHistory(),
  routes: [
    { path: "/", redirect: "/chat" },
    { path: "/chat", component: ChatView },
    { path: "/playground", component: PlaygroundView },
  ],
});
