<template>
  <div
    v-if="open"
    ref="attachMenuRef"
    class="prompt-popover attach-menu prompt-floating-menu tw-absolute tw-z-popover tw-rounded-control tw-border tw-border-app-border tw-bg-app-menu tw-shadow-menu"
    :style="attachMenuStyle"
    role="menu"
  >
    <button
      v-if="cameraOption"
      type="button"
      role="menuitem"
      @click="selectAttach(cameraOption.id)"
    >
      <span aria-hidden="true">{{ cameraOption.icon }}</span>
      <p>{{ cameraOption.label }}</p>
    </button>

    <button
      v-if="imageOption"
      type="button"
      role="menuitem"
      @click="selectAttach(imageOption.id)"
    >
      <span aria-hidden="true">{{ imageOption.icon }}</span>
      <p>{{ imageOption.label }}</p>
    </button>

    <button
      v-if="fileOption"
      type="button"
      role="menuitem"
      @click="selectAttach(fileOption.id)"
    >
      <span aria-hidden="true">{{ fileOption.icon }}</span>
      <p>{{ fileOption.label }}</p>
    </button>
  </div>
</template>

<script setup>
/**
 * @file components/prompt/attach/desktop/PromptAttachFloatMenu.vue
 * @description PC 첨부 플로팅 메뉴입니다. 메뉴 항목은 동적 control 정의 없이 컴포넌트 내부에서 직접 렌더링합니다.
 */

import {computed, nextTick, ref, watch} from "vue";
import {autoUpdate, flip, offset, shift, useFloating} from "@floating-ui/vue";
import {FILE_PICKER_TYPE} from "@/constants/promptComposer";

const props = defineProps({
  open: {type: Boolean, default: false},
  referenceElement: {type: Object, default: null},
  attachOptions: {type: Array, default: () => []},
});

const emit = defineEmits(["open-file-picker"]);

const attachMenuRef = ref(null);
const attachPositionReady = ref(false);

const attachReferenceRef = computed(() => props.referenceElement || null);

const {floatingStyles: attachFloatingStyles, update: updateAttachFloating} =
  useFloating(attachReferenceRef, attachMenuRef, {
    placement: "top-start",
    strategy: "absolute",
    transform: false,
    whileElementsMounted: autoUpdate,
    middleware: [
      offset(10),
      flip({fallbackPlacements: ["top-end", "bottom-start", "bottom-end"]}),
      shift({padding: 12}),
    ],
  });

const cameraOption = computed(() =>
  props.attachOptions.find((option) => option.id === FILE_PICKER_TYPE.camera)
);
const imageOption = computed(() =>
  props.attachOptions.find((option) => option.id === FILE_PICKER_TYPE.image)
);
const fileOption = computed(() =>
  props.attachOptions.find((option) => option.id === FILE_PICKER_TYPE.all)
);

const attachMenuStyle = computed(() => ({
  ...attachFloatingStyles.value,
  visibility: attachPositionReady.value ? "visible" : "hidden",
}));

function selectAttach(type) {
  emit("open-file-picker", type);
}

watch(
  () => props.open,
  async (open) => {
    attachPositionReady.value = false;
    if (!open) return;

    await nextTick();
    await updateAttachFloating?.();
    attachPositionReady.value = true;
  },
  {flush: "post"}
);
</script>

<style scoped lang="scss">
.prompt-popover {
  box-sizing: border-box;
}

.prompt-floating-menu {
  top: auto;
  right: auto;
  bottom: auto;
  left: auto;
  z-index: var(--z-popover);
}
</style>
