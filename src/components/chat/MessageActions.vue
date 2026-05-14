<!--
@file MessageActions.vue * @description Vue component used in the chat web
application runtime. * @author OpenAI
-->

<template>
  <div class="message-actions" :class="`message-actions--${role}`">
    <button
      v-if="role === 'assistant'"
      type="button"
      :class="{active: feedback === 'like'}"
      aria-label="좋아요"
      @click="setFeedback('like')"
    >
      좋아요
    </button>
    <button
      v-if="role === 'assistant'"
      type="button"
      :class="{active: feedback === 'dislike'}"
      aria-label="싫어요"
      @click="setFeedback('dislike')"
    >
      싫어요
    </button>
    <button type="button" aria-label="복사하기" @click="copy">복사하기</button>
  </div>
</template>

<script setup>
import {ref} from "vue";
import {copyClipboardByPlatform} from "@/services/platformBridge";

const props = defineProps({
  role: {type: String, required: true},
  content: {type: String, default: ""},
});
const feedback = ref("");
function setFeedback(value) {
  feedback.value = feedback.value === value ? "" : value;
}
async function copy() {
  try {
    await copyClipboardByPlatform(props.content || "");
  } catch (error) {
    console.warn("Failed to copy message.", error);
  }
}
</script>
