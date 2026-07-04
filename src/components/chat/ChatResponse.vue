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
        v-if="viewContent"
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
        :content="sourceContent"
        :show-regenerate="showRegenerate"
        @regenerate="handleRegenerate"
      />
    </div>
  </article>
</template>

<script setup>
import {computed, nextTick, onBeforeUnmount, ref, watch} from "vue";
import {useI18n} from "vue-i18n";
import {renderMermaidInElement} from "@/utils/mermaidRenderer";
import {
  destroyMarkdownScrollbars,
  enhanceMarkdownScrollbars,
} from "@/platform/scroll/overlayScrollbarController";
import {resolveMermaidPlatformSettings} from "@/utils/mermaidPlatformSettings";
import {logWarn} from "@/utils/logger";
import {
  openExternalBrowser,
  copyClipboardByPlatform,
} from "@/platform/bridge/platformBridge";
import {usePlatformStore} from "@/stores/platformStore";
import AssistantDuoLinks from "./AssistantDuoLinks.vue";
import AssistantRagImages from "./AssistantRagImages.vue";
import MessageActions from "./MessageActions.vue";

const props = defineProps({
  message: {type: Object, required: true},
  content: {type: String, default: ""},
  reasonContent: {type: String, default: ""},
  isGeneration: {type: Boolean, default: false},
  respMsgId: {type: String, default: ""},
  showRegenerate: {type: Boolean, default: true},
  interactionBlocked: {type: Boolean, default: false},
});
const {locale, t} = useI18n();
const platformStore = usePlatformStore();
const emit = defineEmits(["rendered", "regenerate"]);
function notifyRendered(type) {
  emit("rendered", {messageId: props.message.id, type});
}
const html = ref("");
const reasoningHtml = ref("");
const viewContent = ref("");
const viewReasonContent = ref("");
const contentMarkdownRendered = ref(false);
const reasoningMarkdownRendered = ref(false);
const contentRef = ref(null);
const reasoningRef = ref(null);
const reasoningOpen = ref(false);
let renderVersion = 0;
let reasoningRenderVersion = 0;
let componentAlive = true;
let contentTimer = null;
let reasonContentTimer = null;

const sourceContent = computed(() => props.content || props.message.content || "");
const sourceReasonContent = computed(
  () => props.reasonContent || props.message.reasoningContent || ""
);
const shouldWriteText = computed(
  () =>
    props.isGeneration &&
    props.respMsgId &&
    props.message.id === props.respMsgId
);
const hasReasoning = computed(() => Boolean(viewReasonContent.value));
const hasDuoLinks = computed(
  () => Array.isArray(props.message.duo) && props.message.duo.length > 0
);
const hasRagImages = computed(
  () =>
    Array.isArray(props.message.ragimage) && props.message.ragimage.length > 0
);
const showMessageActions = computed(
  () =>
    !props.interactionBlocked &&
    (!props.message.status || props.message.status === "complete")
);
const isMessageComplete = computed(
  () => !props.message.status || props.message.status === "complete"
);

const resolvedMermaidSettings = computed(() =>
  resolveMermaidPlatformSettings()
);
const showMermaidHeader = computed(
  () => resolvedMermaidSettings.value.showMermaidHeader
);
const enableMermaidRendering = computed(
  () => resolvedMermaidSettings.value.enableMermaidRendering
);

function handleRegenerate() {
  emit("regenerate", props.message);
}

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

function tableToText(table) {
  return Array.from(table.rows)
    .map((row) =>
      Array.from(row.cells)
        .map((cell) => cell.innerText.replace(/\s+/g, " ").trim())
        .join("\t")
    )
    .join("\n");
}

function tableToCsv(table) {
  return Array.from(table.rows)
    .map((row) =>
      Array.from(row.cells)
        .map(
          (cell) =>
            `"${cell.innerText.replace(/"/g, '""').replace(/\s+/g, " ").trim()}"`
        )
        .join(",")
    )
    .join("\n");
}

function downloadText(content, filename, type = "text/plain;charset=utf-8") {
  const blob = new Blob([content], {type});
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function downloadCsv(csv) {
  downloadText(
    `\ufeff${csv}`,
    `table-${Date.now()}.csv`,
    "text/csv;charset=utf-8"
  );
}

function resolveMermaidSource(card) {
  const mermaid = card?.querySelector(".md-mermaid");
  return (
    mermaid?.getAttribute("data-mermaid-source") || mermaid?.textContent || ""
  );
}

function resolveMermaidSvg(card) {
  const svg = card?.querySelector(".md-mermaid svg");
  if (!svg) return "";
  const clone = svg.cloneNode(true);
  if (!clone.getAttribute("xmlns")) {
    clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  }
  return new XMLSerializer().serializeToString(clone);
}

async function handleMarkdownClick(event) {
  const root = event.currentTarget;
  const tableButton = event.target?.closest?.("button[data-md-table-action]");
  if (tableButton && root?.contains(tableButton)) {
    event.preventDefault();
    event.stopPropagation();
    const table = tableButton.closest(".md-table-card")?.querySelector("table");
    if (!table) return;
    if (tableButton.dataset.mdTableAction === "copy") {
      await copyClipboardByPlatform(tableToText(table));
      return;
    }
    if (tableButton.dataset.mdTableAction === "csv") {
      downloadCsv(tableToCsv(table));
    }
    return;
  }

  const mermaidButton = event.target?.closest?.(
    "button[data-md-mermaid-action]"
  );
  if (mermaidButton && root?.contains(mermaidButton)) {
    event.preventDefault();
    event.stopPropagation();
    const card = mermaidButton.closest(".md-mermaid-card");
    const action = mermaidButton.dataset.mdMermaidAction;
    if (action === "copy") {
      const source = resolveMermaidSource(card);
      if (source) await copyClipboardByPlatform(source);
      return;
    }
    if (action === "code") {
      const source = resolveMermaidSource(card);
      if (source) downloadText(source, `mermaid-${Date.now()}.mmd`);
      return;
    }
    if (action === "svg") {
      const svg = resolveMermaidSvg(card);
      if (svg)
        downloadText(
          svg,
          `mermaid-${Date.now()}.svg`,
          "image/svg+xml;charset=utf-8"
        );
    }
    return;
  }

  const codeButton = event.target?.closest?.("button[data-md-code-action]");
  if (codeButton && root?.contains(codeButton)) {
    event.preventDefault();
    event.stopPropagation();
    const pre = codeButton.closest(".md-code-card")?.querySelector("pre");
    const code =
      pre?.getAttribute("data-md-code-source") || pre?.innerText || "";
    if (codeButton.dataset.mdCodeAction === "copy" && code) {
      await copyClipboardByPlatform(code);
    }
    return;
  }

  const anchor = event.target?.closest?.("a[href]");
  if (!anchor || !root?.contains(anchor)) return;
  const href = anchor.getAttribute("href");
  if (!href || href.startsWith("#") || !platformStore.info.isAndroidApp) return;
  event.preventDefault();
  event.stopPropagation();
  await openExternalBrowser(anchor.href);
}

const handleReasoningClick = handleMarkdownClick;

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
    enhanceMarkdownScrollbars(root, {enabled: true});
    notifyRendered("enhanced");
  } catch (error) {
    if (componentAlive) {
      logWarn("[ChatResponse] markdown enhancement failed:", error);
    }
  }
}

function clearContentTimer() {
  if (contentTimer) {
    window.clearInterval(contentTimer);
    contentTimer = null;
  }
}

function clearReasonContentTimer() {
  if (reasonContentTimer) {
    window.clearInterval(reasonContentTimer);
    reasonContentTimer = null;
  }
}

function writeContent(value = "") {
  clearContentTimer();
  const nextValue = String(value || "");

  if (!shouldWriteText.value) {
    viewContent.value = nextValue;
    return;
  }

  if (!nextValue.startsWith(viewContent.value)) {
    viewContent.value = "";
  }

  contentTimer = window.setInterval(() => {
    if (!componentAlive || viewContent.value.length >= nextValue.length) {
      clearContentTimer();
      return;
    }

    viewContent.value = nextValue.substring(0, viewContent.value.length + 1);
  }, 12);
}

function writeReasonContent(value = "") {
  clearReasonContentTimer();
  const nextValue = String(value || "");

  if (!shouldWriteText.value) {
    viewReasonContent.value = nextValue;
    return;
  }

  if (!nextValue.startsWith(viewReasonContent.value)) {
    viewReasonContent.value = "";
  }

  reasonContentTimer = window.setInterval(() => {
    if (
      !componentAlive ||
      viewReasonContent.value.length >= nextValue.length
    ) {
      clearReasonContentTimer();
      return;
    }

    viewReasonContent.value = nextValue.substring(
      0,
      viewReasonContent.value.length + 1
    );
  }, 12);
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

async function renderContent() {
  const currentVersion = ++renderVersion;
  contentMarkdownRendered.value = false;

  try {
    if (!componentAlive) return;
    const {renderMarkdown} = await import("@/utils/markdown");
    const rendered = viewContent.value
      ? await renderMarkdown(viewContent.value, {
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
    notifyRendered("content");

    void enhanceRenderedMarkdown({
      root: contentRef.value,
      source: viewContent.value,
      currentVersion,
      getVersion: () => renderVersion,
      renderMermaid: isMessageComplete.value && enableMermaidRendering.value,
    });
  } catch (error) {
    if (!componentAlive || currentVersion !== renderVersion) return;
    logWarn("[ChatResponse] content render failed:", error);
    destroyMarkdownScrollbars(contentRef.value);
    html.value = escapeHtml(viewContent.value || "");
    await nextTick();
    if (!componentAlive || currentVersion !== renderVersion) return;
    contentMarkdownRendered.value = true;
    notifyRendered("content");
  }
}

async function renderReasoningContent() {
  const currentVersion = ++reasoningRenderVersion;
  reasoningMarkdownRendered.value = false;

  try {
    if (!componentAlive) return;
    if (!viewReasonContent.value) {
      reasoningHtml.value = "";
      reasoningMarkdownRendered.value = true;
      notifyRendered("reasoning");
      return;
    }

    const {renderMarkdown} = await import("@/utils/markdown");
    const rendered = await renderMarkdown(viewReasonContent.value, {
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
    notifyRendered("reasoning");

    void enhanceRenderedMarkdown({
      root: reasoningRef.value,
      source: viewReasonContent.value,
      currentVersion,
      getVersion: () => reasoningRenderVersion,
      renderMermaid: isMessageComplete.value && enableMermaidRendering.value,
    });
  } catch (error) {
    if (!componentAlive || currentVersion !== reasoningRenderVersion) return;
    logWarn("[ChatResponse] reasoning render failed:", error);
    destroyMarkdownScrollbars(reasoningRef.value);
    reasoningHtml.value = escapeHtml(viewReasonContent.value || "");
    await nextTick();
    if (!componentAlive || currentVersion !== reasoningRenderVersion) return;
    reasoningMarkdownRendered.value = true;
    notifyRendered("reasoning");
  }
}

watch(
  () => sourceContent.value,
  (value) => writeContent(value),
  {immediate: true}
);
watch(
  () => sourceReasonContent.value,
  (value) => writeReasonContent(value),
  {immediate: true}
);
watch(() => [viewContent.value, props.message.status], renderContent, {
  immediate: true,
});
watch(
  () => [viewReasonContent.value, props.message.status],
  renderReasoningContent,
  {immediate: true}
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
  clearContentTimer();
  clearReasonContentTimer();
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
