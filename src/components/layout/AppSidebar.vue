<template>
  <aside
    class="app-sidebar"
    :class="{
      'app-sidebar--open': isOpen,
      'app-sidebar--overlay': isMobileOrTablet
    }"
  >
    <div class="app-sidebar__inner">
      <div class="app-sidebar__section app-sidebar__section--user">
        <div class="app-sidebar__avatar">U</div>
        <div class="app-sidebar__userinfo">
          <div class="app-sidebar__username">Demo User</div>
          <div class="app-sidebar__role">Studio / Radar</div>
        </div>
      </div>

      <nav class="app-sidebar__section app-sidebar__section--nav">
        <div class="app-sidebar__group-title">Navigation</div>
        <ul>
          <li
            class="app-sidebar__item"
            :class="{ 'app-sidebar__item--active': activePage === 'chat' }"
            @click="$emit('navigate', 'chat')"
          >
            <span class="app-sidebar__icon">💬</span>
            <span class="app-sidebar__label">Chat</span>
          </li>
          <li
            class="app-sidebar__item"
            :class="{ 'app-sidebar__item--active': activePage === 'playground' }"
            @click="$emit('navigate', 'playground')"
          >
            <span class="app-sidebar__icon">🧪</span>
            <span class="app-sidebar__label">Playground</span>
          </li>
          <li class="app-sidebar__item">
            <span class="app-sidebar__icon">📊</span>
            <span class="app-sidebar__label">Analytics (dummy)</span>
          </li>
          <li class="app-sidebar__item">
            <span class="app-sidebar__icon">⚙️</span>
            <span class="app-sidebar__label">Settings (dummy)</span>
          </li>
        </ul>
      </nav>

      <div class="app-sidebar__section app-sidebar__section--hint">
        <div class="app-sidebar__hint-title">Tip</div>
        <p class="app-sidebar__hint-text">
          UI Playground에서 공통 컴포넌트를 먼저 디자인한 뒤,
          실제 화면(챗, 대시보드, 설정)에 붙여나가면 개발 속도가 매우 빨라집니다.
        </p>
      </div>
    </div>

    <div
      v-if="isMobileOrTablet"
      class="app-sidebar__backdrop"
      :class="{ 'app-sidebar__backdrop--visible': isOpen }"
      @click="$emit('close')"
    />
  </aside>
</template>

<script>
export default {
  name: "AppSidebar",
  props: {
    isOpen: {
      type: Boolean,
      default: true
    },
    isMobileOrTablet: {
      type: Boolean,
      default: false
    },
    activePage: {
      type: String,
      default: "chat"
    }
  },
  emits: ["close", "navigate"]
};
</script>

<style lang="scss">
@use "@/assets/styles/components/appsidebar.scss";
</style>
