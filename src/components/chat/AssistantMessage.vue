<!--
@file AssistantMessage.vue * @description Vue component used in the chat
web application runtime. * @author OpenAI
-->

<template>
  <article class="message message--assistant">
    <div class="avatar">AI</div>
    <div class="bubble bubble--assistant">
      <div class="bubble-meta">Assistant</div>
      <div
        v-if="message.content"
        ref="contentRef"
        class="bubble-content markdown-body"
        @click.capture="handleMarkdownClick"
        v-html="html"
      ></div>
      <MessageActions role="assistant" :content="message.content" />
    </div>
  </article>
</template>

<script setup>
import { nextTick, onMounted, ref, watch } from "vue";
import { renderMarkdown } from "@/utils/markdown";
import { openExternalBrowser } from "@/services/platformBridge";
import { usePlatformStore } from "@/stores/platformStore";
import { renderMermaidInElement } from "@/utils/mermaidRenderer";
import MessageActions from "./MessageActions.vue";

const props = defineProps({ message: { type: Object, required: true } });
const platformStore = usePlatformStore();
const emit = defineEmits(["rendered"]);
const html = ref("<p></p>");
const contentRef = ref(null);
let renderVersion = 0;
/**
 * Android WebView에서는 target="_blank" 링크가 현재 WebView 안에서 열릴 수 있어
 * Markdown 내부 anchor 클릭을 Native Bridge의 외부 브라우저 열기로 명시적으로 위임합니다.
 *
 * @param {MouseEvent} event Markdown 콘텐츠 영역에서 발생한 클릭 이벤트
 * @returns {Promise<void>} 외부 링크 처리 완료 Promise
 */
/**
 * handleMarkdownClick 처리 함수입니다.
 * @param {*} event 함수 실행에 필요한 입력값입니다.
 * @returns {Promise<*>} 비동기 처리 결과를 반환합니다.
 */
async function handleMarkdownClick(event) {
  const anchor = event.target?.closest?.("a[href]");
  if (!anchor || !contentRef.value?.contains(anchor)) return;

  const href = anchor.getAttribute("href");
  if (!href || href.startsWith("#")) return;

  if (!platformStore.info.isAndroidApp) return;

  event.preventDefault();
  event.stopPropagation();
  await openExternalBrowser(anchor.href);
}

/**
 * renderContent 처리 함수입니다.
 * @returns {Promise<*>} 비동기 처리 결과를 반환합니다.
 */
async function renderContent() {
  const currentVersion = ++renderVersion;
  const rendered = props.message.content ? await renderMarkdown(props.message.content) : "";
  if (currentVersion !== renderVersion) return;
  html.value = rendered;
  await nextTick();
  await renderMermaidInElement(contentRef.value);
  emit("rendered");
}
watch(() => props.message.content, renderContent, { immediate: true });
onMounted(renderContent);
</script>
