/** * @file UserMessage.vue * @description Vue component used in the chat web
application runtime. * @author OpenAI */

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
            :aria-label="`${file.name} 크게 보기`"
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
import {computed} from "vue";
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
    new CustomEvent("chat:image-preview", {
      detail: {...file, url: getPreviewUrl(file)},
    })
  );
}
function formatFileSize(size) {
  if (!size) return "0 B";
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / 1024 / 1024).toFixed(1)} MB`;
}
</script>
