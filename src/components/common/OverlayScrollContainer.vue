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

import {computed, ref, unref} from "vue";
import {useOverlayKeyboardScrollController} from "@/composables/ui/useOverlayKeyboardScrollController";
import {useOverlayScrollPolicy} from "@/composables/ui/useOverlayScrollPolicy";
import {useOverlayScrollbar} from "@/composables/ui/useOverlayScrollbar";

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
const {isActualAndroidRuntime, shouldUseOverlayScrollbar} = useOverlayScrollPolicy();

function resolveMaybeRef(value) {
  if (typeof value === "function") return value();
  return unref(value);
}

function resolveBoolean(value, fallback = false) {
  const resolved = resolveMaybeRef(value);
  return resolved === undefined || resolved === null
    ? fallback
    : Boolean(resolved);
}

const overlayEnabled = computed(() => resolveBoolean(props.enabled, true));
const keyboardAware = computed(() => resolveBoolean(props.keyboardAware, false));
const overlayScrollbarEnabled = computed(
  () => overlayEnabled.value && shouldUseOverlayScrollbar.value
);
const keyboardControllerEnabled = computed(
  () => overlayEnabled.value && keyboardAware.value && isActualAndroidRuntime.value
);

const overlay = useOverlayScrollbar(rootRef, props.overlayOptions || {}, {
  enabled: () => overlayScrollbarEnabled.value,
  reserveScrollbarGap: props.reserveScrollbarGap ?? true,
});

const keyboardController = useOverlayKeyboardScrollController({
  ...(props.keyboardOptions || {}),
  enabled: () => keyboardControllerEnabled.value,
  viewport: overlay,
  updateOverlay: overlay.update,
});

function getViewport() {
  return overlay.getViewport();
}

const handleFocusIn = keyboardController.handleFocusIn;
const handleFocusOut = keyboardController.handleFocusOut;
const handlePointerDown = keyboardController.handlePointerDown;
const setup = overlay.setup;
const update = overlay.update;
const destroy = overlay.destroy;

defineExpose({
  setup,
  update,
  destroy,
  getViewport,
});
</script>
