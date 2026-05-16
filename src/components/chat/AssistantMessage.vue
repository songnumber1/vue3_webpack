<!--
@file AssistantMessage.vue
@description Assistant message view. Markdown rendering and click behavior are lazy/composable to keep this component UI-focused.
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
import {nextTick, onMounted, ref, watch} from 'vue';
import {useI18n} from 'vue-i18n';
import {renderMermaidInElement} from '@/utils/mermaidRenderer';
import {useMarkdownMessageInteractions} from '@/composables/useMarkdownMessageInteractions';
import MessageActions from './MessageActions.vue';

const props = defineProps({message: {type: Object, required: true}});
const {locale} = useI18n();
const emit = defineEmits(['rendered']);
const html = ref('<p></p>');
const contentRef = ref(null);
const {handleMarkdownClick} = useMarkdownMessageInteractions(contentRef);
let renderVersion = 0;

async function renderContent() {
  const currentVersion = ++renderVersion;
  const {renderMarkdown} = await import(
    /* webpackChunkName: "markdown-runtime" */ '@/utils/markdown'
  );
  const rendered = props.message.content
    ? await renderMarkdown(props.message.content)
    : '';
  if (currentVersion !== renderVersion) return;
  html.value = rendered;
  await nextTick();
  await renderMermaidInElement(contentRef.value);
  emit('rendered');
}

watch(() => props.message.content, renderContent, {immediate: true});
watch(() => locale.value, renderContent);
onMounted(renderContent);
</script>
