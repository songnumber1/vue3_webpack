<template>
  <BaseBottomSheet
    :open="open"
    :title="targetTitle"
    initial-snap="content"
    :min-height="280"
    overlay-class="chat-history-menu-overlay"
    @close="$emit('close')"
  >
    <div class="chat-history-sheet-options">
      <button
        class="bottom-sheet-option bottom-sheet-option--row chat-history-action-option"
        type="button"
        @click="$emit('select', pinActionKey)"
      >
        <span aria-hidden="true">{{ pinActionIcon }}</span>
        <strong>{{ pinActionLabel }}</strong>
      </button>
      <button
        class="bottom-sheet-option bottom-sheet-option--row chat-history-action-option"
        type="button"
        @click="$emit('select', 'rename')"
      >
        <span aria-hidden="true">✎</span>
        <strong>{{ t("chat.historyMenu.rename") }}</strong>
      </button>
      <button
        class="bottom-sheet-option bottom-sheet-option--row chat-history-action-option"
        type="button"
        @click="$emit('select', 'share')"
      >
        <span aria-hidden="true">↗</span>
        <strong>{{ t("chat.historyMenu.share") }}</strong>
      </button>
      <button
        class="bottom-sheet-option bottom-sheet-option--row chat-history-action-option chat-history-action-option--danger"
        type="button"
        @click="$emit('select', 'delete')"
      >
        <span aria-hidden="true">🗑</span>
        <strong>{{ t("chat.historyMenu.delete") }}</strong>
      </button>
    </div>
  </BaseBottomSheet>
</template>

<script setup>
/**
 * @file components/navigation/history/ChatHistoryActionBottomSheet.vue
 * @description 모바일 채팅 이력 액션 BottomSheet 전용 컴포넌트입니다.
 */

import {computed} from "vue";
import {useI18n} from "vue-i18n";
import BaseBottomSheet from "@/components/common/bottom-sheet/BaseBottomSheet.vue";

const props = defineProps({
  open: {type: Boolean, default: false},
  target: {type: Object, default: null},
});

defineEmits(["close", "select"]);

const {t} = useI18n();

const targetTitle = computed(
  () => props.target?.title || t("chat.historyMenu.title")
);
const isPinned = computed(() => Boolean(props.target?.isPinned));
const pinActionKey = computed(() => (isPinned.value ? "unpin" : "pin"));
const pinActionIcon = computed(() => (isPinned.value ? "☆" : "★"));
const pinActionLabel = computed(() =>
  isPinned.value ? t("chat.historyMenu.unpin") : t("chat.historyMenu.pin")
);
</script>
