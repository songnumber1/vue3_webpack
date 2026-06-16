<template>
  <component
    :is="tag"
    ref="rootRef"
    v-bind="$attrs"
    class="overlay-scroll-container"
    :data-overlay-scroll-area="area"
    :data-keyboard-aware="keyboardAware ? 'true' : undefined"
    @focusin="handleFocusIn"
    @focusout="handleFocusOut"
    @pointerdown="handlePointerDown"
  >
    <slot />
  </component>
</template>

<script setup>
/**
 * @file components/common/OverlayScrollContainer.vue
 * @description
 * OverlayScrollbars를 표준 방식으로 연결하는 공통 scroll container입니다.
 * Android 키보드 보정은 keyboard-aware 옵션이 켜진 actual Android runtime에서만
 * useOverlayKeyboardScrollController를 통해 동작합니다.
 */

import {ref} from "vue";
import {useOverlayScrollContainer} from "@/composables/ui/useOverlayScrollContainer";

defineOptions({inheritAttrs: false});

const props = defineProps({
  tag: {type: String, default: "div"},
  area: {type: String, default: "default"},
  enabled: {type: [Boolean, Function], default: true},
  keyboardAware: {type: Boolean, default: false},
  overlayOptions: {type: Object, default: () => ({})},
  keyboardOptions: {type: Object, default: () => ({})},
  reserveScrollbarGap: {type: Boolean, default: true},
});

const rootRef = ref(null);

function resolveEnabledProp() {
  return typeof props.enabled === "function" ? props.enabled() : props.enabled;
}

const scrollContainer = useOverlayScrollContainer(rootRef, {
  enabled: resolveEnabledProp,
  keyboardAware: () => props.keyboardAware,
  overlayOptions: props.overlayOptions,
  keyboardOptions: props.keyboardOptions,
  reserveScrollbarGap: props.reserveScrollbarGap,
});

const {
  handleFocusIn,
  handleFocusOut,
  handlePointerDown,
  setup,
  update,
  destroy,
  getViewport,
} = scrollContainer;

defineExpose({
  setup,
  update,
  destroy,
  getViewport,
});
</script>
