<template>
  <article class="message message--assistant">
    <div class="avatar">AI</div>
    <div class="bubble bubble--assistant">
      <div class="bubble-meta">Assistant</div>

      <section v-if="hasReasoning" class="reasoning-panel">
        <button
          type="button"
          class="reasoning-toggle"
          :aria-expanded="reasoningOpen"
          @click="reasoningOpen = !reasoningOpen"
        >
          <span class="reasoning-chevron" aria-hidden="true">&gt;</span>
          <span>{{ reasoningTitle }}</span>
        </button>
        <div
          v-show="reasoningOpen"
          ref="reasoningRef"
          class="reasoning-content markdown-body"
          @click.capture="handleReasoningClick"
          v-html="reasoningHtml"
        ></div>
      </section>

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
import {computed, nextTick, onMounted, ref, watch} from "vue";
import {useI18n} from "vue-i18n";
import {renderMermaidInElement} from "@/utils/mermaidRenderer";
import {useMarkdownMessageInteractions} from "@/composables/useMarkdownMessageInteractions";
import MessageActions from "./MessageActions.vue";

const props = defineProps({message: {type: Object, required: true}});
const {locale} = useI18n();
const emit = defineEmits(["rendered"]);
const html = ref("<p></p>");
const reasoningHtml = ref("<p></p>");
const contentRef = ref(null);
const reasoningRef = ref(null);
const reasoningOpen = ref(true);
const {handleMarkdownClick} = useMarkdownMessageInteractions(contentRef);
const {handleMarkdownClick: handleReasoningClick} =
  useMarkdownMessageInteractions(reasoningRef);
let renderVersion = 0;
let reasoningRenderVersion = 0;

const hasReasoning = computed(() => Boolean(props.message.reasoningContent));
const reasoningTitle = computed(() =>
  props.message.reasoningStatus === "thinking"
    ? "생각중입니다."
    : "생각이 완료되었습니다."
);

async function renderContent() {
  const currentVersion = ++renderVersion;
  const {renderMarkdown} = await import("@/utils/markdown");
  const rendered = props.message.content
    ? await renderMarkdown(props.message.content)
    : "";
  if (currentVersion !== renderVersion) return;
  html.value = rendered;
  await nextTick();
  await renderMermaidInElement(contentRef.value);
  emit("rendered");
}

async function renderReasoningContent() {
  const currentVersion = ++reasoningRenderVersion;
  const {renderMarkdown} = await import("@/utils/markdown");
  const rendered = props.message.reasoningContent
    ? await renderMarkdown(props.message.reasoningContent)
    : "";
  if (currentVersion !== reasoningRenderVersion) return;
  reasoningHtml.value = rendered;
  await nextTick();
  await renderMermaidInElement(reasoningRef.value);
  emit("rendered");
}

watch(() => props.message.content, renderContent, {immediate: true});
watch(() => props.message.reasoningContent, renderReasoningContent, {
  immediate: true,
});
watch(() => locale.value, () => {
  renderContent();
  renderReasoningContent();
});
onMounted(() => {
  renderContent();
  renderReasoningContent();
});
</script>
