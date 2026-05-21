<template>
  <div class="sidebar-user sidebar-user--mobile">
    <button
      class="sidebar-user-profile"
      type="button"
      :aria-label="t('common.settings')"
      @click="actions.openSettings()"
    >
      <div class="user-avatar">{{ userInitial }}</div>
      <div class="sidebar-user-main">
        <strong>{{ displayName }}</strong
        ><small>{{ t("common.plus") }}</small>
      </div>
    </button>
    <div class="sidebar-user-actions">
      <button
        v-if="systemSettings.showThemeButton"
        class="sidebar-user-action"
        type="button"
        :aria-label="t('common.theme')"
        @click="actions.toggleTheme()"
      >
        <span class="theme-glyph"></span>
      </button>
      <button
        v-if="systemSettings.showPlaygroundMenu"
        class="sidebar-user-action"
        type="button"
        :aria-label="t('common.playground')"
        :title="t('common.playground')"
        @click="actions.openPlayground()"
      >
        <span class="playground-glyph">▦</span>
      </button>
      <button
        v-if="systemSettings.showSwaggerButton"
        class="sidebar-user-action"
        type="button"
        :aria-label="t('common.swagger')"
        @click="actions.openSwagger()"
      >
        <SwaggerDocIcon />
      </button>
      <button
        v-if="systemSettings.showLogoutButton"
        class="sidebar-user-action sidebar-user-action--logout"
        type="button"
        :aria-label="t('common.logout')"
        :title="t('common.logout')"
        @click="actions.logout()"
      >
        <span class="logout-glyph">⏻</span>
      </button>
    </div>
  </div>
</template>

<script setup>
import {computed, inject} from "vue";
import {useI18n} from "vue-i18n";
import {storeToRefs} from "pinia";
import SwaggerDocIcon from "@/components/icons/SwaggerDocIcon.vue";
import {useAuthStore} from "@/stores/authStore";
import {useSystemSettingsStore} from "@/stores/systemSettingsStore";
import {
  CHAT_ACTIONS_KEY,
  createEmptyChatActions,
} from "@/composables/chat/chatActionContext";

const {t} = useI18n();
const authStore = useAuthStore();
const systemSettingsStore = useSystemSettingsStore();
const {userName} = storeToRefs(authStore);
const {settings: systemSettings} = storeToRefs(systemSettingsStore);

const actions = inject(CHAT_ACTIONS_KEY, createEmptyChatActions());

const displayName = computed(() => userName.value || t("common.user"));
const userInitial = computed(() => {
  const name = displayName.value;
  return name ? name.charAt(0) : "U";
});
</script>

<style scoped>
/* Scoped layout guard: keep component roots and flex/grid children shrink-safe. */
.sidebar-user--mobile,
.sidebar-user-profile,
.sidebar-user-main,
.sidebar-user-actions {
  min-width: 0;
  box-sizing: border-box;
}

.sidebar-user--mobile {
  min-height: 0;
}
</style>
