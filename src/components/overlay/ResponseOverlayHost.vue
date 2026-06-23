<template>
  <ResponsiveOverlay
    v-if="usesResponsiveOverlay"
    :open="isOpen"
    :title="overlayTitle"
    :subtitle="overlaySubtitle"
    :panel-class="overlayPanelClass"
    @close="closeResponseOverlayByBackOrDirect"
  >
    <NoticeView
      v-if="activeOverlayType === APP_OVERLAY_TYPES.NOTICE"
      @close="closeResponseOverlayByBackOrDirect"
      @applied="emit('applied')"
    />
    <PrivacyPolicyView
      v-else-if="activeOverlayType === APP_OVERLAY_TYPES.PRIVACY"
      @close="closeResponseOverlayByBackOrDirect"
      @applied="emit('applied')"
    />
    <PersonalizationView
      v-else-if="activeOverlayType === APP_OVERLAY_TYPES.PERSONALIZATION"
      @close="closeResponseOverlayByBackOrDirect"
      @applied="emit('applied')"
    />
    <SystemSettingsView
      v-else-if="activeOverlayType === APP_OVERLAY_TYPES.SYSTEM"
      @close="closeResponseOverlayByBackOrDirect"
      @applied="emit('applied')"
    />
  </ResponsiveOverlay>

  <LanguageSelectSheet
    v-else-if="activeOverlayType === APP_OVERLAY_TYPES.LANGUAGE"
    :open="isOpen"
    @close="closeResponseOverlayByBackOrDirect"
    @applied="emit('applied')"
  />

  <MobileSettingsPanel
    v-else-if="activeOverlayType === APP_OVERLAY_TYPES.MOBILE_SETTINGS"
    :open="isOpen"
    @close="closeResponseOverlayByBackOrDirect"
    @desktop-open="handleMobileSettingsDesktopOpen"
    @applied="emit('applied')"
  />
</template>

<script setup>
/**
 * @file components/overlay/ResponseOverlayHost.vue
 * @description responseOverlay 계열 화면을 하나의 host에서 직접 렌더링합니다.
 */

import {useI18n} from "vue-i18n";
import ResponsiveOverlay from "@/components/overlay/ResponsiveOverlay.vue";
import LanguageSelectSheet from "@/components/menu/LanguageSelectSheet.vue";
import MobileSettingsPanel from "@/views/settings/MobileSettingsPanel.vue";
import NoticeView from "@/views/settings/NoticeView.vue";
import PersonalizationView from "@/views/settings/PersonalizationView.vue";
import PrivacyPolicyView from "@/views/settings/PrivacyPolicyView.vue";
import SystemSettingsView from "@/views/settings/SystemSettingsView.vue";
import {useViewportStore} from "@/stores/viewportStore";
import {
  APP_OVERLAY_TYPES,
  closeResponseOverlayByBackOrDirect,
  createResponseOverlayViewState,
  handleMobileSettingsDesktopOpen,
  setupResponseOverlayBackGuard,
} from "@/composables/overlay/responseOverlayActions";

const emit = defineEmits(["applied"]);
const {t} = useI18n();
const viewportStore = useViewportStore();
setupResponseOverlayBackGuard(viewportStore);

const {
  activeOverlayType,
  isOpen,
  overlayTitle,
  overlaySubtitle,
  overlayPanelClass,
  usesResponsiveOverlay,
} = createResponseOverlayViewState(t, viewportStore);
</script>
