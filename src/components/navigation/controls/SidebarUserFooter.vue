<template>
  <div class="sidebar-user sidebar-user--mobile">
    <button
      class="sidebar-user-profile"
      type="button"
      :aria-label="t('common.settings')"
      @click="responseOverlay.openSettings()"
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
        <span class="logout-glyph" aria-hidden="true"></span>
      </button>
    </div>
  </div>
</template>

<script setup>
/**
 * @file components/navigation/controls/SidebarUserFooter.vue
 * @description 좌측 메뉴/드로어 관련 UI입니다. navigation store 상태와 사용자 메뉴 action을 화면에 연결합니다.
 *
 * 프리징 코드 주석 기준:
 * - 이 주석은 코드 추적을 돕기 위한 설명이며 런타임 동작을 변경하지 않습니다.
 * - 함수/상태가 다른 composable, store, component로 전달되는 경우 호출 방향을 먼저 확인하세요.
 */

import {computed} from "vue";
import {useI18n} from "vue-i18n";
import {storeToRefs} from "pinia";
import SwaggerDocIcon from "@/components/icons/SwaggerDocIcon.vue";
import {useAuthStore} from "@/stores/authStore";
import {useSystemSettingsStore} from "@/stores/systemSettingsStore";
import {useResponseOverlay} from "@/composables/overlay/useResponseOverlay";
import {useAppShellActions} from "@/composables/app/useAppShellActions";

const {t} = useI18n();
const authStore = useAuthStore();
const systemSettingsStore = useSystemSettingsStore();
const {userName} = storeToRefs(authStore);
const {settings: systemSettings} = storeToRefs(systemSettingsStore);

const actions = useAppShellActions();
const responseOverlay = useResponseOverlay();

const displayName = computed(() => userName.value || t("common.user"));
const userInitial = computed(() => {
  const name = displayName.value;
  return name ? name.charAt(0) : "U";
});
</script>

<style scoped lang="scss">
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
