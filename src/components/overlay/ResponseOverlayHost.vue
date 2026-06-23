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

import ResponsiveOverlay from "@/components/overlay/ResponsiveOverlay.vue";
import {useResponseOverlay} from "@/composables/overlay/useResponseOverlay";

const emit = defineEmits(["applied"]);

const {
  isOpen,
  overlayComponent,
  overlayTitle,
  overlaySubtitle,
  overlayPanelClass,
  usesResponsiveOverlay,
  usesStandaloneOverlay,
  closeResponseOverlayByBackOrDirect,
  handleMobileSettingsDesktopOpen,
} = useResponseOverlay({enableBackGuard: true});

</script>
