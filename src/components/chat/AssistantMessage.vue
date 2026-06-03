<template>
  <article
    class="message message--assistant tw-flex tw-w-full tw-min-w-0 tw-items-start tw-gap-3"
    :class="{'message--streaming': !isMessageComplete}"
  >
    <div class="avatar tw-inline-flex tw-shrink-0 tw-items-center tw-justify-center tw-rounded-full tw-bg-app-assistantAvatar tw-font-bold tw-text-app-assistantAvatarText">AI</div>
    <div class="bubble bubble--assistant tw-min-w-0 tw-flex-1 tw-bg-app-bubbleAssistant">
      <div class="bubble-meta tw-text-xs tw-font-semibold tw-text-app-subtle">Assistant</div>

      <section v-if="hasReasoning" class="reasoning-panel tw-rounded-control tw-border tw-border-app-reasoningBorder tw-bg-app-reasoning">
        <button
          type="button"
          class="reasoning-toggle tw-flex tw-w-full tw-items-center tw-gap-2 tw-text-left"
          :aria-expanded="reasoningOpen"
          @click="reasoningOpen = !reasoningOpen"
        >
          <svg
            class="reasoning-chevron tw-shrink-0"
            aria-hidden="true"
            viewBox="0 0 16 16"
            focusable="false"
          >
            <path d="M6 4l4 4-4 4" />
          </svg>
          <span>{{ reasoningTitle }}</span>
        </button>
        <div
          v-show="reasoningOpen"
          ref="reasoningRef"
          class="reasoning-content markdown-body tw-min-w-0"
          @click.capture="handleReasoningClick"
          v-html="reasoningHtml"
        ></div>
      </section>

      <div
        v-if="message.content"
        ref="contentRef"
        class="bubble-content markdown-body tw-min-w-0 tw-break-words"
        @click.capture="handleMarkdownClick"
        v-html="html"
      ></div>
      <MessageActions
        v-if="showMessageActions"
        role="assistant"
        :content="message.content"
        :show-regenerate="showRegenerate"
        @regenerate="emit('regenerate', message)"
      />
    </div>
  </article>
</template>

<script setup>
/**
 * @file components/chat/AssistantMessage.vue
 * @description 채팅 UI 컴포넌트입니다. 메시지, 헤더, 입력 영역, 이미지 프리뷰 등 실제 화면 렌더를 담당합니다.
 *
 * 프리징 코드 주석 기준:
 * - 이 주석은 코드 추적을 돕기 위한 설명이며 런타임 동작을 변경하지 않습니다.
 * - 함수/상태가 다른 composable, store, component로 전달되는 경우 호출 방향을 먼저 확인하세요.
 */

import {computed, nextTick, onBeforeUnmount, ref, watch} from "vue";
import {useI18n} from "vue-i18n";
import {renderMermaidInElement} from "@/utils/mermaidRenderer";
import {
  destroyMarkdownScrollbars,
  enhanceMarkdownScrollbars,
} from "@/utils/overlayScrollbar";
import {useMarkdownTools} from "@/composables/markdown/useMarkdownTools";
import {useInteractionGuard} from "@/composables/runtime/useInteractionGuard";
import {logWarn} from "@/utils/logger";
import MessageActions from "./MessageActions.vue";

/**
 * 상위 컴포넌트에서 전달되는 렌더링/상태 제어 입력값입니다.
 */
const props = defineProps({
  message: {type: Object, required: true},
  showRegenerate: {type: Boolean, default: true},
  deferMermaidEnhancement: {type: Boolean, default: false},
});
const {locale, t} = useI18n();
const emit = defineEmits(["rendered", "regenerate"]);
const {isInteractionBlocked} = useInteractionGuard();
const html = ref("<p></p>");
const reasoningHtml = ref("<p></p>");
const contentRef = ref(null);
const reasoningRef = ref(null);
const reasoningOpen = ref(false);
const {handleMarkdownClick} = useMarkdownTools(contentRef);
const {handleMarkdownClick: handleReasoningClick} =
  useMarkdownTools(reasoningRef);
let renderVersion = 0;
let reasoningRenderVersion = 0;
let componentAlive = true;

const hasReasoning = computed(() => Boolean(props.message.reasoningContent));
const showMessageActions = computed(
  () =>
    !isInteractionBlocked.value &&
    (!props.message.status || props.message.status === "complete")
);
const isMessageComplete = computed(
  () => !props.message.status || props.message.status === "complete"
);

const reasoningTitle = computed(() =>
  props.message.reasoningStatus === "thinking"
    ? t("chat.reasoning.thinking")
    : t("chat.reasoning.completed")
);


function hasMermaidContent(value = "") {
  return /```\s*mermaid|class=["'][^"']*\bmd-mermaid\b|data-mermaid-pending/i.test(
    String(value || "")
  );
}

function reservePendingMermaidHeight(root) {
  if (!root) return;
  root
    .querySelectorAll('.md-mermaid[data-mermaid-pending="true"]')
    .forEach((element) => {
      if (!element.style.minHeight) {
        element.style.minHeight = "160px";
      }
    });
}

async function enhanceRenderedMarkdown({
  root,
  source,
  currentVersion,
  getVersion,
  renderMermaid = false,
}) {
  try {
    if (!componentAlive || !root?.isConnected) return;
    if (renderMermaid && hasMermaidContent(source)) {
      await renderMermaidInElement(root);
    }
    if (!componentAlive || !root?.isConnected) return;
    if (currentVersion !== getVersion()) return;
    enhanceMarkdownScrollbars(root);
    emit("rendered", "enhanced");
  } catch (error) {
    if (componentAlive) {
      logWarn("[AssistantMessage] markdown enhancement failed:", error);
    }
  }
}

function escapeHtml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
    .replace(/\n/g, "<br>");
}

/**
 * Markdown, Mermaid 또는 Vue DOM에 표시할 결과물을 렌더링합니다.
 */
async function renderContent() {
  const currentVersion = ++renderVersion;

  try {
    if (!componentAlive) return;
    const {renderMarkdown} = await import("@/utils/markdown");
    const rendered = props.message.content
      ? await renderMarkdown(props.message.content, {
          renderMermaid: isMessageComplete.value,
        })
      : "";
    if (!componentAlive || currentVersion !== renderVersion) return;
    html.value = rendered;
    await nextTick();
    if (!componentAlive || currentVersion !== renderVersion) return;

    reservePendingMermaidHeight(contentRef.value);
    emit("rendered", "content");

    void enhanceRenderedMarkdown({
      root: contentRef.value,
      source: props.message.content,
      currentVersion,
      getVersion: () => renderVersion,
      renderMermaid: isMessageComplete.value && !props.deferMermaidEnhancement,
    });
  } catch (error) {
    if (!componentAlive || currentVersion !== renderVersion) return;
    logWarn("[AssistantMessage] content render failed:", error);
    html.value = escapeHtml(props.message.content || "");
    emit("rendered", "content");
  }
}

/**
 * Markdown, Mermaid 또는 Vue DOM에 표시할 결과물을 렌더링합니다.
 */
async function renderReasoningContent() {
  const currentVersion = ++reasoningRenderVersion;

  try {
    if (!componentAlive) return;
    if (!props.message.reasoningContent) {
      reasoningHtml.value = "";
      emit("rendered", "reasoning");
      return;
    }

    const {renderMarkdown} = await import("@/utils/markdown");
    const rendered = await renderMarkdown(props.message.reasoningContent);
    if (!componentAlive || currentVersion !== reasoningRenderVersion) return;
    reasoningHtml.value = rendered;
    await nextTick();
    if (!componentAlive || currentVersion !== reasoningRenderVersion) return;

    reservePendingMermaidHeight(reasoningRef.value);
    emit("rendered", "reasoning");

    void enhanceRenderedMarkdown({
      root: reasoningRef.value,
      source: props.message.reasoningContent,
      currentVersion,
      getVersion: () => reasoningRenderVersion,
      renderMermaid: true,
    });
  } catch (error) {
    if (!componentAlive || currentVersion !== reasoningRenderVersion) return;
    logWarn("[AssistantMessage] reasoning render failed:", error);
    reasoningHtml.value = escapeHtml(props.message.reasoningContent || "");
    emit("rendered", "reasoning");
  }
}

watch(() => [props.message.content, props.message.status], renderContent, {
  immediate: true,
});
watch(() => props.message.reasoningContent, renderReasoningContent, {
  immediate: true,
});
watch(
  () => props.deferMermaidEnhancement,
  async (deferMermaidEnhancement, previousDeferMermaidEnhancement) => {
    if (deferMermaidEnhancement || !previousDeferMermaidEnhancement) return;
    if (!isMessageComplete.value) return;

    await nextTick();

    const currentContentVersion = renderVersion;
    // 초기 hydration 완료 시점의 Mermaid 렌더링은 MessageList 단위에서 한 번만 수행합니다.
    // 각 AssistantMessage가 동시에 Mermaid queue를 생성하면 큰 대화방 전환 후에도
    // 이전 DOM root를 잡은 비동기 작업이 오래 남아 메모리 회수가 지연될 수 있습니다.
    void enhanceRenderedMarkdown({
      root: contentRef.value,
      source: props.message.content,
      currentVersion: currentContentVersion,
      getVersion: () => renderVersion,
      renderMermaid: false,
    });

    const currentReasoningVersion = reasoningRenderVersion;
    void enhanceRenderedMarkdown({
      root: reasoningRef.value,
      source: props.message.reasoningContent,
      currentVersion: currentReasoningVersion,
      getVersion: () => reasoningRenderVersion,
      renderMermaid: false,
    });
  },
  {flush: "post"}
);
watch(
  () => locale.value,
  () => {
    renderContent();
    renderReasoningContent();
  }
);

onBeforeUnmount(() => {
  componentAlive = false;
  renderVersion += 1;
  reasoningRenderVersion += 1;
  destroyMarkdownScrollbars(contentRef.value);
  destroyMarkdownScrollbars(reasoningRef.value);
  html.value = "";
  reasoningHtml.value = "";
});

</script>

