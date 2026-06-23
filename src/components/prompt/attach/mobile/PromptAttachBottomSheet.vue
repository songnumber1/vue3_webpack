<template>
  <BaseBottomSheet :open="open" :title="resolvedTitle" @close="$emit('close')">
    <button
      v-if="cameraOption"
      class="bottom-sheet-option bottom-sheet-option--row tw-flex tw-w-full tw-items-center tw-gap-2.5 tw-text-left"
      type="button"
      @click="selectAttach(cameraOption.id)"
    >
      <span aria-hidden="true">{{ cameraOption.icon }}</span>
      <strong>{{ cameraOption.label }}</strong>
    </button>

    <button
      v-if="imageOption"
      class="bottom-sheet-option bottom-sheet-option--row tw-flex tw-w-full tw-items-center tw-gap-2.5 tw-text-left"
      type="button"
      @click="selectAttach(imageOption.id)"
    >
      <span aria-hidden="true">{{ imageOption.icon }}</span>
      <strong>{{ imageOption.label }}</strong>
    </button>

    <button
      v-if="fileOption"
      class="bottom-sheet-option bottom-sheet-option--row tw-flex tw-w-full tw-items-center tw-gap-2.5 tw-text-left"
      type="button"
      @click="selectAttach(fileOption.id)"
    >
      <span aria-hidden="true">{{ fileOption.icon }}</span>
      <strong>{{ fileOption.label }}</strong>
    </button>
  </BaseBottomSheet>
</template>

<script setup>
/**
 * @file components/prompt/attach/mobile/PromptAttachBottomSheet.vue
 * @description 모바일 첨부 바텀시트입니다. 항목은 컴포넌트 내부에서 직접 작성하고 노출 여부만 상태로 제어합니다.
 */

import {computed} from "vue";
import {useI18n} from "vue-i18n";
import BaseBottomSheet from "@/components/common/bottom-sheet/BaseBottomSheet.vue";
import {FILE_PICKER_TYPE} from "@/constants/promptComposer";

const props = defineProps({
  open: {type: Boolean, default: false},
  title: {type: String, default: ""},
  attachOptions: {type: Array, default: () => []},
});

const emit = defineEmits(["close", "open-file-picker"]);
const {t} = useI18n();

const resolvedTitle = computed(() => props.title || t("chat.attach"));
const cameraOption = computed(() =>
  props.attachOptions.find((option) => option.id === FILE_PICKER_TYPE.camera)
);
const imageOption = computed(() =>
  props.attachOptions.find((option) => option.id === FILE_PICKER_TYPE.image)
);
const fileOption = computed(() =>
  props.attachOptions.find((option) => option.id === FILE_PICKER_TYPE.all)
);

function selectAttach(type) {
  emit("open-file-picker", type);
}
</script>
