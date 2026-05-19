<template>
  <ResponsiveOverlay
    :open="open"
    :is-mobile="isMobile"
    :title="title"
    mobile-mode="dialog"
    @close="$emit('cancel')"
  >
    <div class="chat-history-dialog">
      <p v-if="message" class="chat-history-dialog__message">{{ message }}</p>
      <label v-if="mode === 'rename'" class="chat-history-dialog__field">
        <span>{{ t("chat.historyDialog.titleField") }}</span>
        <input
          v-model="draftTitle"
          class="chat-history-dialog__input"
          type="text"
          maxlength="80"
          autocomplete="off"
          @keyup.enter="confirm"
        />
      </label>
      <div class="chat-history-dialog__actions">
        <button
          class="playground-button playground-button--secondary"
          type="button"
          @click="$emit('cancel')"
        >
          {{ t("common.cancel") }}
        </button>
        <button class="playground-button" type="button" @click="confirm">
          {{ t("common.confirm") }}
        </button>
      </div>
    </div>
  </ResponsiveOverlay>
</template>

<script setup>
import {ref, watch} from "vue";
import {useI18n} from "vue-i18n";
import ResponsiveOverlay from "@/components/overlay/ResponsiveOverlay.vue";

const {t} = useI18n();

const props = defineProps({
  open: {type: Boolean, default: false},
  isMobile: {type: Boolean, default: false},
  mode: {type: String, default: "rename"},
  title: {type: String, default: ""},
  message: {type: String, default: ""},
  initialTitle: {type: String, default: ""},
});
const emit = defineEmits(["cancel", "confirm"]);
const draftTitle = ref("");

function confirm() {
  emit("confirm", props.mode === "rename" ? draftTitle.value.trim() : true);
}

watch(
  () => [props.open, props.initialTitle],
  () => {
    if (props.open) draftTitle.value = props.initialTitle || "";
  },
  {immediate: true}
);
</script>

<style scoped>
/* Scoped layout guard: keep component roots and flex/grid children shrink-safe. */
:where(*) {
  box-sizing: border-box;
  min-width: 0;
}
</style>
