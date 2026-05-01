import { createRouter, createWebHistory } from 'vue-router'
import ChatPage from '@/views/ChatPage.vue'

const baseRoutes = [
  { path: '/', name: 'chat', component: ChatPage, meta: { title: 'Chat' } },
  { path: '/:pathMatch(.*)*', redirect: '/' }
]

const androidRoutes = []

export function resolveRouter(platform) {
  const routes = [...baseRoutes, ...(platform === 'android' ? androidRoutes : [])]
  return createRouter({ history: createWebHistory(), routes })
}
