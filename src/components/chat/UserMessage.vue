<template>
  <article class="message message--user">
    <div class="bubble bubble--user">
      <div class="bubble-meta">You</div>
      <div
        v-if="hasAttachments"
        class="message-attachments message-attachments--user"
      >
        <template v-for="file in message.attachments" :key="file.id">
          <button
            v-if="file.kind === 'image'"
            type="button"
            class="message-image-card"
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
            class="message-file-card"
            :href="file.url"
            :download="file.name"
          >
            <span class="message-file-icon" aria-hidden="true">📄</span>
            <span
              ><strong>{{ file.name }}</strong
              ><small>{{ formatFileSize(file.size) }}</small></span
            >
          </a>
        </template>
      </div>
      <div v-if="message.content" class="bubble-content bubble-content--plain">
        {{ message.content }}
      </div>
      <MessageActions role="user" :content="message.content" />
    </div>
  </article>
</template>

<script setup>
import {useI18n} from "vue-i18n";

const {t} = useI18n();
import {computed} from "vue";
import {IMAGE_PREVIEW_EVENT} from "@/constants/promptComposer";
import {formatFileSize} from "@/utils/attachment";
import MessageActions from "./MessageActions.vue";
const props = defineProps({message: {type: Object, required: true}});
defineEmits(["rendered"]);
const hasAttachments = computed(
  () =>
    Array.isArray(props.message.attachments) &&
    props.message.attachments.length > 0
);
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

<style scoped>
/* Component-local styles should stay scoped. */
</style>
