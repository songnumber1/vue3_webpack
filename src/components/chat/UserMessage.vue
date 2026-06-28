<template>
  <article
    class="message message--user tw-flex tw-w-full tw-min-w-0 tw-justify-end"
  >
    <div
      class="bubble bubble--user tw-min-w-0 tw-rounded-messageUser tw-bg-app-messageUser tw-text-app-messageUserText"
    >
      <div class="bubble-meta tw-text-xs tw-font-semibold tw-text-app-subtle">
        You
      </div>
      <div
        v-if="hasAttachments"
        class="message-attachments message-attachments--user tw-flex tw-flex-wrap tw-gap-2"
      >
        <template v-for="file in message.attachments" :key="file.id">
          <button
            v-if="file.kind === 'image'"
            type="button"
            class="message-image-card tw-overflow-hidden tw-rounded-control tw-border tw-border-app-messageBorder tw-bg-app-surface"
            :aria-label="t('chat.imagePreview.enlarge', {name: file.name})"
            @click.stop="openImage(file)"
          >
            <img
              :src="getPreviewUrl(file)"
              :alt="file.name"
              @load="$emit('rendered')"
              @error="$emit('rendered')"
            />
          </button>
          <a
            v-else
            class="message-file-card tw-flex tw-items-center tw-gap-2 tw-rounded-control tw-border tw-border-app-messageBorder tw-bg-app-surface"
            :href="file.url"
            :download="file.name"
          >
            <span
              class="message-file-icon tw-inline-flex tw-shrink-0 tw-items-center tw-justify-center"
              aria-hidden="true"
              >📄</span
            >
            <span
              ><strong>{{ file.name }}</strong
              ><small>{{ formatFileSize(file.size) }}</small></span
            >
          </a>
        </template>
      </div>
      <div
        v-if="message.content"
        class="bubble-content bubble-content--plain tw-min-w-0 tw-whitespace-pre-wrap tw-break-words"
      >
        {{ message.content }}
      </div>
      <MessageActions
        v-if="showMessageActions"
        role="user"
        :content="message.content"
      />
    </div>
  </article>
</template>

<script setup>
/**
 * @file components/chat/UserMessage.vue
 * @description 채팅 UI 컴포넌트입니다. 메시지, 헤더, 입력 영역, 이미지 프리뷰 등 실제 화면 렌더를 담당합니다.
 */

import {computed} from "vue";
import {useI18n} from "vue-i18n";
import {useChatStreamStore} from "@/stores/chatStreamStore";
import {IMAGE_PREVIEW_EVENT} from "@/constants/promptComposer";
import {formatFileSize} from "@/utils/attachment";
import MessageActions from "./MessageActions.vue";

const {t} = useI18n();
/**
 * 상위 컴포넌트에서 전달되는 렌더링/상태 제어 입력값입니다.
 */
const props = defineProps({
  message: {type: Object, required: true},
});
defineEmits(["rendered"]);
const chatStreamStore = useChatStreamStore();
const isInteractionBlocked = computed(() => chatStreamStore.isWait);
const showMessageActions = computed(() => !isInteractionBlocked.value);
const hasAttachments = computed(
  () =>
    Array.isArray(props.message.attachments) &&
    props.message.attachments.length > 0
);
/**
 * 현재 DOM, store, runtime 값에서 필요한 값을 조회합니다.
 */
function getPreviewUrl(file) {
  return file?.previewUrl || file?.dataUrl || file?.url || "";
}
/**
 * 관련 modal, sheet, menu, overlay 상태를 열림 상태로 전환합니다.
 */
function openImage(file) {
  window.dispatchEvent(
    new CustomEvent(IMAGE_PREVIEW_EVENT, {
      detail: {...file, url: getPreviewUrl(file)},
    })
  );
}
</script>
