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
        v-if="
          Array.isArray(chatCompletion.attachments) && chatCompletion.attachments.length > 0
        "
        class="message-attachments message-attachments--user tw-flex tw-flex-wrap tw-gap-2"
      >
        <template v-for="file in chatCompletion.attachments" :key="file.id">
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
        v-if="chatCompletion.content"
        class="bubble-content bubble-content--plain tw-min-w-0 tw-whitespace-pre-wrap tw-break-words"
      >
        {{ chatCompletion.content }}
      </div>
      <MessageActions role="user" :content="chatCompletion.content" />
    </div>
  </article>
</template>

<script setup>
import {computed} from "vue";
import {useI18n} from "vue-i18n";
import {IMAGE_PREVIEW_EVENT} from "@/constants/promptComposer";
import {formatFileSize} from "@/utils/attachment";
import MessageActions from "./MessageActions.vue";

const {t} = useI18n();
const props = defineProps({
  requireInfo: {type: Object, required: true},
});

const chatCompletion = computed(() => props.requireInfo?.chatCompletion || {});
function getPreviewUrl(file) {
  return file?.previewUrl || file?.dataUrl || file?.url || "";
}
function openImage(file) {
  window.dispatchEvent(
    new CustomEvent(IMAGE_PREVIEW_EVENT, {
      detail: {...file, url: getPreviewUrl(file)},
    })
  );
}
</script>
