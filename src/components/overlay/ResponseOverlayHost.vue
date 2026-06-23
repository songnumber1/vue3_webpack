<template>
  <ResponsiveOverlay
    v-if="usesResponsiveOverlay"
    :open="isOpen"
    :title="overlayTitle"
    :subtitle="overlaySubtitle"
    :panel-class="overlayPanelClass"
    @close="closeResponseOverlayByBackOrDirect"
  >
    <component
      :is="overlayComponent"
      v-if="overlayComponent"
      @close="closeResponseOverlayByBackOrDirect"
      @applied="emit('applied')"
    />
  </ResponsiveOverlay>

  <component
    :is="overlayComponent"
    v-else-if="usesStandaloneOverlay && overlayComponent"
    :open="isOpen"
    @close="closeResponseOverlayByBackOrDirect"
    @desktop-open="handleMobileSettingsDesktopOpen"
    @applied="emit('applied')"
  />
</template>

<script setup>
/**
 * @file components/overlay/ResponseOverlayHost.vue
 * @description responseOverlay 계열 화면을 하나의 host에서 렌더링합니다.
 */

import {useI18n} from "vue-i18n";
import ResponsiveOverlay from "@/components/overlay/ResponsiveOverlay.vue";
import {useViewportStore} from "@/stores/viewportStore";
import {
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
  isOpen,
  overlayComponent,
  overlayTitle,
  overlaySubtitle,
  overlayPanelClass,
  usesResponsiveOverlay,
  usesStandaloneOverlay,
} = createResponseOverlayViewState(t, viewportStore);

</script>
