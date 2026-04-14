import { createRouter, createWebHashHistory } from 'vue-router';
import ChatPage from '@/pages/chat/ChatPage.vue';
import SettingsPage from '@/pages/settings/SettingsPage.vue';

const routes = [
  { path: '/', name: 'chat', component: ChatPage },
  { path: '/settings', name: 'settings', component: SettingsPage }
];

export default createRouter({
  history: createWebHashHistory(),
  routes
});
