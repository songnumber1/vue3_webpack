<template>
  <AppModal
    :open="open"
    :title="title"
    size="sm"
    :close-on-backdrop="false"
    @close="$emit('cancel')"
  >
    <div class="chat-history-dialog tw-grid tw-gap-4">
      <p
        v-if="message"
        class="chat-history-dialog__message tw-m-0 tw-text-sm tw-leading-relaxed tw-text-app-subtle"
      >
        {{ message }}
      </p>

      <label
        v-if="mode === 'rename'"
        class="chat-history-dialog__field tw-grid tw-gap-2"
      >
        <span>{{ t("chat.historyDialog.titleField") }}</span>
        <input
          v-model="draftTitle"
          class="chat-history-dialog__input tw-h-11 tw-w-full tw-rounded-dialogInput tw-border tw-border-solid tw-border-app-controlBorder tw-bg-app-control tw-px-3 tw-text-base tw-text-app-text"
          type="text"
          name="chat-title-edit"
          maxlength="80"
          autocomplete="new-password"
          autocapitalize="none"
          autocorrect="off"
          spellcheck="false"
          enterkeyhint="done"
          data-lpignore="true"
          data-form-type="other"
          @keyup.enter="confirm"
        />
      </label>

      <div v-else-if="mode === 'share'" class="chat-history-dialog__share">
        <label
          v-if="shareUrl"
          class="chat-history-dialog__field tw-grid tw-gap-2"
        >
          <span>{{ t("chat.historyDialog.shareLinkField") }}</span>
          <input
            class="chat-history-dialog__input tw-h-11 tw-w-full tw-rounded-dialogInput tw-border tw-border-solid tw-border-app-controlBorder tw-bg-app-control tw-px-3 tw-text-sm tw-text-app-text"
            type="text"
            :value="shareUrl"
            readonly
            @focus="$event.target.select()"
          />
        </label>

        <p
          v-else
          class="chat-history-dialog__message tw-m-0 tw-text-sm tw-leading-relaxed tw-text-app-subtle"
        >
          {{ t("chat.historyDialog.sharePendingMessage") }}
        </p>
      </div>
    </div>

    <template #footer>
      <div
        class="chat-history-dialog__actions tw-flex tw-items-center tw-justify-end tw-gap-2"
      >
        <button
          class="playground-button playground-button--secondary"
          type="button"
          @click="$emit('cancel')"
        >
          {{ t("common.cancel") }}
        </button>
        <button class="playground-button" type="button" @click="primaryAction">
          {{ primaryLabel }}
        </button>
      </div>
    </template>
  </AppModal>
</template>

<script setup>
/**
 * @file components/navigation/history/ChatHistoryConfirmDialog.vue
 * @description 채팅 이력 rename/delete/share 확인 다이얼로그입니다. 메뉴 UI가 아닌 확인/입력 Modal만 담당합니다.
 */

import {computed, ref, watch} from "vue";
import {useI18n} from "vue-i18n";
import AppModal from "@/components/common/modal/AppModal.vue";
import {copyClipboardByPlatform} from "@/platform/bridge/platformBridge";
import {logWarn} from "@/utils/logger";

const {t} = useI18n();

/**
 * 상위 컴포넌트에서 전달되는 렌더링/상태 제어 입력값입니다.
 */
const props = defineProps({
  open: {type: Boolean, default: false},
  mode: {type: String, default: "rename"},
  title: {type: String, default: ""},
  message: {type: String, default: ""},
  initialTitle: {type: String, default: ""},
  shareUrl: {type: String, default: ""},
});
const emit = defineEmits(["cancel", "confirm"]);
const draftTitle = ref("");

const primaryLabel = computed(() => {
  if (props.mode === "share" && props.shareUrl) {
    return t("chat.historyDialog.copyShareLink");
  }

  if (props.mode === "share") {
    return t("chat.historyDialog.shareAction");
  }

  return t("common.confirm");
});

function confirm() {
  emit("confirm", props.mode === "rename" ? draftTitle.value.trim() : true);
}

async function copyShareLink() {
  if (!props.shareUrl) return;

  try {
    await copyClipboardByPlatform(props.shareUrl);
    emit("cancel");
  } catch (error) {
    logWarn("[ChatHistoryConfirmDialog] copy share link failed:", error);
  }
}

function primaryAction() {
  if (props.mode === "share" && props.shareUrl) {
    copyShareLink();
    return;
  }

  confirm();
}

watch(
  () => [props.open, props.initialTitle],
  () => {
    if (props.open) draftTitle.value = props.initialTitle || "";
  },
  {immediate: true}
);
</script>
