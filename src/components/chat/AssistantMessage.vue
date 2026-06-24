<template>
  <article
    class="message message--assistant tw-flex tw-w-full tw-min-w-0 tw-items-start tw-gap-3"
    :class="{'message--streaming': !isMessageComplete}"
  >
    <div
      class="avatar tw-inline-flex tw-shrink-0 tw-items-center tw-justify-center tw-rounded-full tw-bg-app-assistantAvatar tw-font-bold tw-text-app-assistantAvatarText"
    >
      AI
    </div>
    <div
      class="bubble bubble--assistant tw-min-w-0 tw-flex-1 tw-bg-app-bubbleAssistant"
    >
      <div class="bubble-meta tw-text-xs tw-font-semibold tw-text-app-subtle">
        Assistant
      </div>

      <section
        v-if="hasReasoning"
        class="reasoning-panel tw-rounded-control tw-border tw-border-app-reasoningBorder tw-bg-app-reasoning"
      >
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
          :data-markdown-rendered="reasoningMarkdownRendered ? 'true' : 'false'"
          @click.capture="handleReasoningClick"
          v-html="reasoningHtml"
        ></div>
      </section>

      <div
        v-if="message.content"
        ref="contentRef"
        class="bubble-content markdown-body tw-min-w-0 tw-break-words"
        :data-markdown-rendered="contentMarkdownRendered ? 'true' : 'false'"
        @click.capture="handleMarkdownClick"
        v-html="html"
      ></div>
      <AssistantDuoLinks v-if="hasDuoLinks" :items="message.duo" />
      <AssistantRagImages v-if="hasRagImages" :items="message.ragimage" />
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
 */

import {computed, nextTick, onBeforeUnmount, ref, watch} from "vue";
import {storeToRefs} from "pinia";
import {useI18n} from "vue-i18n";
import {renderMermaidInElement} from "@/utils/mermaidRenderer";
import {
  destroyMarkdownScrollbars,
  enhanceMarkdownScrollbars,
} from "@/platform/scroll/overlayScrollbarController";
import {useMarkdownTools} from "@/composables/markdown/useMarkdownTools";
import {useOverlayScrollPolicy} from "@/composables/ui/useOverlayScrollPolicy";
import {useInteractionGuard} from "@/composables/runtime/useInteractionGuard";
import {useResponsiveContext} from "@/composables/app/responsiveContext";
import {useSystemSettingsStore} from "@/stores/systemSettingsStore";
import {resolveMermaidPlatformSettings} from "@/utils/mermaidPlatformSettings";
import {logWarn} from "@/utils/logger";
import AssistantDuoLinks from "./AssistantDuoLinks.vue";
import AssistantRagImages from "./AssistantRagImages.vue";
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
const systemSettingsStore = useSystemSettingsStore();
const {settings} = storeToRefs(systemSettingsStore);
const responsiveContext = useResponsiveContext();
const emit = defineEmits(["rendered", "regenerate"]);
const {isInteractionBlocked} = useInteractionGuard();
const html = ref("");
const reasoningHtml = ref("");
const contentMarkdownRendered = ref(false);
const reasoningMarkdownRendered = ref(false);
const contentRef = ref(null);
const reasoningRef = ref(null);
const reasoningOpen = ref(false);
const {handleMarkdownClick} = useMarkdownTools(contentRef);
const {handleMarkdownClick: handleReasoningClick} =
  useMarkdownTools(reasoningRef);
const {shouldUseOverlayScrollbar} = useOverlayScrollPolicy();
let renderVersion = 0;
let reasoningRenderVersion = 0;
let componentAlive = true;

const hasReasoning = computed(() => Boolean(props.message.reasoningContent));
const hasDuoLinks = computed(
  () => Array.isArray(props.message.duo) && props.message.duo.length > 0
);
const hasRagImages = computed(
  () =>
    Array.isArray(props.message.ragimage) && props.message.ragimage.length > 0
);
const showMessageActions = computed(
  () =>
    !isInteractionBlocked.value &&
    (!props.message.status || props.message.status === "complete")
);
const isMessageComplete = computed(
  () => !props.message.status || props.message.status === "complete"
);

const resolvedMermaidSettings = computed(() =>
  resolveMermaidPlatformSettings(
    settings.value,
    Boolean(responsiveContext.value?.isMobile)
  )
);
const showMermaidHeader = computed(
  () => resolvedMermaidSettings.value.showMermaidHeader
);
const enableMermaidRendering = computed(
  () => resolvedMermaidSettings.value.enableMermaidRendering
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
    if (
      enableMermaidRendering.value &&
      renderMermaid &&
      hasMermaidContent(source)
    ) {
      await renderMermaidInElement(root);
    }
    if (!componentAlive || !root?.isConnected) return;
    if (currentVersion !== getVersion()) return;
    enhanceMarkdownScrollbars(root, {
      enabled: () => shouldUseOverlayScrollbar.value,
    });
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
  contentMarkdownRendered.value = false;

  try {
    if (!componentAlive) return;
    const {renderMarkdown} = await import("@/utils/markdown");
    const rendered = props.message.content
      ? await renderMarkdown(props.message.content, {
          renderMermaid:
            isMessageComplete.value && enableMermaidRendering.value,
          showMermaidHeader: showMermaidHeader.value,
        })
      : "";
    if (!componentAlive || currentVersion !== renderVersion) return;
    destroyMarkdownScrollbars(contentRef.value);
    html.value = rendered;
    await nextTick();
    if (!componentAlive || currentVersion !== renderVersion) return;
    contentMarkdownRendered.value = true;
    await nextTick();
    if (!componentAlive || currentVersion !== renderVersion) return;

    if (enableMermaidRendering.value) {
      reservePendingMermaidHeight(contentRef.value);
    }
    emit("rendered", "content");

    void enhanceRenderedMarkdown({
      root: contentRef.value,
      source: props.message.content,
      currentVersion,
      getVersion: () => renderVersion,
      renderMermaid:
        isMessageComplete.value &&
        enableMermaidRendering.value &&
        !props.deferMermaidEnhancement,
    });
  } catch (error) {
    if (!componentAlive || currentVersion !== renderVersion) return;
    logWarn("[AssistantMessage] content render failed:", error);
    destroyMarkdownScrollbars(contentRef.value);
    html.value = escapeHtml(props.message.content || "");
    await nextTick();
    if (!componentAlive || currentVersion !== renderVersion) return;
    contentMarkdownRendered.value = true;
    emit("rendered", "content");
  }
}

/**
 * Markdown, Mermaid 또는 Vue DOM에 표시할 결과물을 렌더링합니다.
 */
async function renderReasoningContent() {
  const currentVersion = ++reasoningRenderVersion;
  reasoningMarkdownRendered.value = false;

  try {
    if (!componentAlive) return;
    if (!props.message.reasoningContent) {
      reasoningHtml.value = "";
      reasoningMarkdownRendered.value = true;
      emit("rendered", "reasoning");
      return;
    }

    const {renderMarkdown} = await import("@/utils/markdown");
    const rendered = await renderMarkdown(props.message.reasoningContent, {
      renderMermaid: isMessageComplete.value && enableMermaidRendering.value,
      showMermaidHeader: showMermaidHeader.value,
    });
    if (!componentAlive || currentVersion !== reasoningRenderVersion) return;
    destroyMarkdownScrollbars(reasoningRef.value);
    reasoningHtml.value = rendered;
    await nextTick();
    if (!componentAlive || currentVersion !== reasoningRenderVersion) return;
    reasoningMarkdownRendered.value = true;
    await nextTick();
    if (!componentAlive || currentVersion !== reasoningRenderVersion) return;

    if (enableMermaidRendering.value) {
      reservePendingMermaidHeight(reasoningRef.value);
    }
    emit("rendered", "reasoning");

    void enhanceRenderedMarkdown({
      root: reasoningRef.value,
      source: props.message.reasoningContent,
      currentVersion,
      getVersion: () => reasoningRenderVersion,
      renderMermaid:
        isMessageComplete.value &&
        enableMermaidRendering.value &&
        !props.deferMermaidEnhancement,
    });
  } catch (error) {
    if (!componentAlive || currentVersion !== reasoningRenderVersion) return;
    logWarn("[AssistantMessage] reasoning render failed:", error);
    destroyMarkdownScrollbars(reasoningRef.value);
    reasoningHtml.value = escapeHtml(props.message.reasoningContent || "");
    await nextTick();
    if (!componentAlive || currentVersion !== reasoningRenderVersion) return;
    reasoningMarkdownRendered.value = true;
    emit("rendered", "reasoning");
  }
}

watch(
  () => [
    props.message.content,
    props.message.status,
    showMermaidHeader.value,
    enableMermaidRendering.value,
  ],
  renderContent,
  {immediate: true}
);
watch(
  () => [
    props.message.reasoningContent,
    showMermaidHeader.value,
    enableMermaidRendering.value,
  ],
  renderReasoningContent,
  {immediate: true}
);
watch(
  () => props.deferMermaidEnhancement,
  async (deferMermaidEnhancement, previousDeferMermaidEnhancement) => {
    if (deferMermaidEnhancement || !previousDeferMermaidEnhancement) return;
    if (!isMessageComplete.value) return;

    await nextTick();

    const currentContentVersion = renderVersion;
    // history historyRender 중에는 MessageList가 v-for DOM 순서대로 Mermaid를 직렬 처리합니다.
    // historyRender이 끝난 뒤에도 pending Mermaid가 남아 있는 예외 케이스는 여기서 한 번 더 안전하게 처리합니다.
    void enhanceRenderedMarkdown({
      root: contentRef.value,
      source: props.message.content,
      currentVersion: currentContentVersion,
      getVersion: () => renderVersion,
      renderMermaid: isMessageComplete.value && enableMermaidRendering.value,
    });

    const currentReasoningVersion = reasoningRenderVersion;
    void enhanceRenderedMarkdown({
      root: reasoningRef.value,
      source: props.message.reasoningContent,
      currentVersion: currentReasoningVersion,
      getVersion: () => reasoningRenderVersion,
      renderMermaid: isMessageComplete.value && enableMermaidRendering.value,
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
  contentMarkdownRendered.value = false;
  reasoningMarkdownRendered.value = false;
});
</script>
