import { createRouter, createWebHistory } from "vue-router";
import AppLayout from "@/components/layout/AppLayout.vue";
import ChatView from "@/views/ChatView.vue";
import PlaygroundView from "@/views/PlaygroundView.vue";

export default createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: "/",
      component: AppLayout,
      children: [
        { path: "", redirect: "/main" },
        // ✅ NewChatLanding 전용(라우터 분리)
        { path: "main", name: "main", component: ChatView },
        { path: "chat/:id?", name: "chat", component: ChatView, props: true },
        { path: "playground", component: PlaygroundView },
      ],
    },
  ],
});
