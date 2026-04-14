<template>
  <div class="page-container">
    <div class="topbar">
      <div>
        <h1 style="margin: 0 0 6px 0;">멀티 플랫폼 반응형 웹앱</h1>
        <div class="badge">{{ platform }} · {{ device }} · {{ theme }} · {{ apiVersion }}</div>
      </div>
      <div class="topbar-actions">
        <router-link class="btn secondary" to="/">채팅</router-link>
        <router-link class="btn secondary" to="/settings">설정</router-link>
        <button class="btn" type="button" @click="$emit('refresh')">새로고침</button>
      </div>
    </div>

    <div class="layout-grid">
      <aside class="sidebar-panel card" style="padding: 20px;">
        <slot name="sidebar" />
      </aside>
      <main class="content-panel">
        <slot />
      </main>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ResponsiveLayout',
  props: {
    platform: { type: String, default: 'web' },
    device: { type: String, default: 'desktop' },
    theme: { type: String, default: 'default' },
    apiVersion: { type: String, default: 'v1' }
  },
  emits: ['refresh']
};
</script>
