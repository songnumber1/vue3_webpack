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

// 모듈 의존성을 모두 불러온 뒤, 아래에서 화면 상태와 실행 로직을 구성합니다.
const props = defineProps({message: {type: Object, required: true}});
const {locale} = useI18n();
const emit = defineEmits(['rendered']);
const html = ref('<p></p>');
const contentRef = ref(null);
const {handleMarkdownClick} = useMarkdownMessageInteractions(contentRef);
let renderVersion = 0;

/**
 * @description renderContent 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {void} voidParam - 별도 입력값 없이 실행됩니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
async function renderContent() {
  const currentVersion = ++renderVersion;
  const {renderMarkdown} = await import(
 '@/utils/markdown'
  );
  const rendered = props.message.content
    ? await renderMarkdown(props.message.content)
    : '';
  // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
  if (currentVersion !== renderVersion) return;
  html.value = rendered;
  await nextTick();
  await renderMermaidInElement(contentRef.value);
  emit('rendered');
}

// Vue 반응형 실행 구간입니다. 상태 변경과 생명주기 흐름을 이 영역에서 연결합니다.
watch(() => props.message.content, renderContent, {immediate: true});
// Vue 반응형 실행 구간입니다. 상태 변경과 생명주기 흐름을 이 영역에서 연결합니다.
watch(() => locale.value, renderContent);
// Vue 반응형 실행 구간입니다. 상태 변경과 생명주기 흐름을 이 영역에서 연결합니다.
onMounted(renderContent);
</script>
