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
import { useI18n } from "vue-i18n";
import { renderMarkdown } from "@/utils/markdown";
import { openExternalBrowser } from "@/services/platformBridge";
import { copyClipboardByPlatform } from "@/services/platformBridge";
import { usePlatformStore } from "@/stores/platformStore";
import { renderMermaidInElement } from "@/utils/mermaidRenderer";
import MessageActions from "./MessageActions.vue";

const props = defineProps({ message: { type: Object, required: true } });
const { locale } = useI18n();
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
  const tableActionButton = event.target?.closest?.(
    "button[data-md-table-action]",
  );
  if (tableActionButton && contentRef.value?.contains(tableActionButton)) {
    event.preventDefault();
    event.stopPropagation();
    await handleTableAction(tableActionButton);
    return;
  }

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
 * Converts a rendered HTML table into tab-separated text for clipboard copying.
 * @param {HTMLTableElement} table Rendered table element.
 * @returns {string} Tab-separated table text.
 */
function tableToText(table) {
  return Array.from(table.rows)
    .map((row) =>
      Array.from(row.cells)
        .map((cell) => cell.innerText.replace(/\s+/g, " ").trim())
        .join("\t"),
    )
    .join("\n");
}

/**
 * Converts a rendered HTML table into CSV content.
 * @param {HTMLTableElement} table Rendered table element.
 * @returns {string} CSV content.
 */
function tableToCsv(table) {
  return Array.from(table.rows)
    .map((row) =>
      Array.from(row.cells)
        .map(
          (cell) =>
            `"${cell.innerText.replace(/"/g, '""').replace(/\s+/g, " ").trim()}"`,
        )
        .join(","),
    )
    .join("\n");
}

/**
 * Downloads CSV text as a local file from the browser.
 * @param {string} csv CSV content.
 * @returns {void}
 */
function downloadCsv(csv) {
  const blob = new Blob([`\ufeff${csv}`], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `table-${Date.now()}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

/**
 * Handles markdown table toolbar actions.
 * @param {HTMLButtonElement} button Clicked table action button.
 * @returns {Promise<void>} Action completion promise.
 */
async function handleTableAction(button) {
  const card = button.closest(".md-table-card");
  const table = card?.querySelector("table");
  if (!table) return;

  const action = button.dataset.mdTableAction;
  if (action === "copy") {
    await copyClipboardByPlatform(tableToText(table));
    return;
  }
  if (action === "csv") {
    downloadCsv(tableToCsv(table));
  }
}

/**
 * renderContent 처리 함수입니다.
 * @returns {Promise<*>} 비동기 처리 결과를 반환합니다.
 */
async function renderContent() {
  const currentVersion = ++renderVersion;
  const rendered = props.message.content
    ? await renderMarkdown(props.message.content)
    : "";
  if (currentVersion !== renderVersion) return;
  html.value = rendered;
  await nextTick();
  await renderMermaidInElement(contentRef.value);
  emit("rendered");
}
watch(() => props.message.content, renderContent, { immediate: true });
watch(() => locale.value, renderContent);
onMounted(renderContent);
</script>
