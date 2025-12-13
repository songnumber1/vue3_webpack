<template>
  <aside
    class="app-sidebar"
    :class="{
      'app-sidebar--open': isOpen,
      'app-sidebar--overlay': isMobileOrTablet,
    }"
  >
    <div class="app-sidebar__inner">
      <div class="app-sidebar__section app-sidebar__section--user">
        <BaseAvatar class="app-sidebar__avatar" name="Demo User" :size="40" />
        <div class="app-sidebar__userinfo">
          <div class="app-sidebar__username">Demo User</div>
          <div class="app-sidebar__role">Studio / Radar</div>
        </div>
      </div>

      <nav class="app-sidebar__section app-sidebar__section--nav">
        <div class="app-sidebar__group-title">Navigation</div>
        <BaseList
          class="app-sidebar__nav-list"
          :items="navItems"
          item-key="key"
          @item-click="handleNavClick"
        >
          <template #item="{ item }">
            <BaseButton
              class="app-sidebar__item"
              :class="{ 'app-sidebar__item--active': activePage === item.key }"
              variant="ghost"
              block
              :disabled="item.disabled"
            >
              <span class="app-sidebar__icon">{{ item.icon }}</span>
              <span class="app-sidebar__label">{{ item.label }}</span>
            </BaseButton>
          </template>
        </BaseList>
      </nav>

      <BaseCard
        class="app-sidebar__section app-sidebar__section--hint"
        :hoverable="false"
      >
        <template #header>
          <div class="app-sidebar__hint-title">Tip</div>
        </template>
        <p class="app-sidebar__hint-text">
          UI Playground에서 공통 컴포넌트를 먼저 디자인한 뒤, 실제 화면(챗,
          대시보드, 설정)에 붙여나가면 개발 속도가 매우 빨라집니다.
        </p>
      </BaseCard>
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
import BaseAvatar from "@/components/common/BaseAvatar.vue";
import BaseButton from "@/components/common/BaseButton.vue";
import BaseCard from "@/components/common/BaseCard.vue";
import BaseList from "@/components/common/BaseList.vue";

export default {
  name: "AppSidebar",
  components: {
    BaseAvatar,
    BaseButton,
    BaseCard,
    BaseList,
  },
  props: {
    isOpen: {
      type: Boolean,
      default: true,
    },
    isMobileOrTablet: {
      type: Boolean,
      default: false,
    },
    activePage: {
      type: String,
      default: "chat",
    },
  },
  emits: ["close", "navigate"],
  data() {
    return {
      navItems: [
        { key: "chat", icon: "💬", label: "Chat" },
        { key: "playground", icon: "🧪", label: "Playground" },
        {
          key: "analytics",
          icon: "📊",
          label: "Analytics (dummy)",
          disabled: true,
        },
        {
          key: "settings",
          icon: "⚙️",
          label: "Settings (dummy)",
          disabled: true,
        },
      ],
    };
  },
  methods: {
    handleNavClick(item) {
      if (item.disabled) return;
      this.$emit("navigate", item.key);
    },
  },
};
</script>

<style lang="scss">
@use "@/assets/styles/layout/appsidebar.scss";
</style>
