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

<style lang="scss" scoped>
@import "@/assets/styles/mixins";

.app-sidebar {
  width: var(--layout-sidebar-width);
  border-right: 1px solid var(--color-border);
  background-color: var(--color-bg-soft);
  height: calc(100vh - var(--layout-header-height));
  position: sticky;
  top: var(--layout-header-height);
  z-index: 15;
  overflow: hidden;

  &__inner {
    height: 100%;
    display: flex;
    flex-direction: column;
    padding: var(--space-4) var(--space-3);
    gap: var(--space-4);
  }

  &__section--user {
    display: flex;
    align-items: center;
    gap: var(--space-3);
  }

  &__avatar {
    width: 40px;
    height: 40px;
    border-radius: 999px;
    background: var(--color-primary);
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 600;
  }

  &__userinfo {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  &__username {
    font-size: var(--font-size-sm);
    font-weight: 600;
  }

  &__role {
    font-size: var(--font-size-xs);
    color: var(--color-text-muted);
  }

  &__group-title {
    font-size: var(--font-size-xs);
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--color-text-muted);
    margin-bottom: var(--space-2);
  }

  &__item {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-2);
    border-radius: var(--radius-md);
    font-size: var(--font-size-sm);
    cursor: pointer;
    color: var(--color-text-muted);
    transition: background-color 0.18s ease, color 0.18s ease;

    &:hover {
      background-color: var(--color-primary-soft);
      color: var(--color-text);
    }

    &--active {
      background-color: var(--color-primary-soft);
      color: var(--color-primary);
      font-weight: 600;
    }
  }

  &__icon {
    width: 1.2rem;
    text-align: center;
  }

  &__section--hint {
    margin-top: auto;
    padding: var(--space-3);
    border-radius: var(--radius-lg);
    background-color: var(--color-surface);
    border: 1px dashed var(--color-border);
  }

  &__hint-title {
    font-size: var(--font-size-xs);
    font-weight: 600;
    margin-bottom: var(--space-1);
  }

  &__hint-text {
    font-size: var(--font-size-xs);
    color: var(--color-text-muted);
    margin: 0;
  }

  &__backdrop {
    display: none;
  }
}

@include mobile {
  .app-sidebar {
    position: fixed;
    top: var(--layout-header-height);
    left: 0;
    height: calc(100vh - var(--layout-header-height));
    transform: translateX(-100%);
    transition: transform 0.2s ease-in-out;
    box-shadow: var(--shadow-soft);

    &--open {
      transform: translateX(0);
    }

    &__backdrop {
      position: fixed;
      inset: 0;
      top: var(--layout-header-height);
      background: rgba(15, 23, 42, 0.4);
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.2s ease-in-out;
      display: block;

      &--visible {
        opacity: 1;
        pointer-events: auto;
      }
    }
  }
}

@include tablet {
  .app-sidebar {
    position: fixed;
    top: var(--layout-header-height);
    left: 0;
    height: calc(100vh - var(--layout-header-height));
    transform: translateX(-100%);
    transition: transform 0.2s ease-in-out;
    box-shadow: var(--shadow-soft);

    &--open {
      transform: translateX(0);
    }

    &__backdrop {
      position: fixed;
      inset: 0;
      top: var(--layout-header-height);
      background: rgba(15, 23, 42, 0.4);
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.2s ease-in-out;
      display: block;

      &--visible {
        opacity: 1;
        pointer-events: auto;
      }
    }
  }
}
</style>
