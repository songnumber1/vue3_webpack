<template>
  <div
    :id="id"
    ref="markdownRef"
    class="markdown-viewer markdown-body tw-min-w-0 tw-break-words"
    :class="{'markdown-viewer--reasoning': isReasoning}"
    :data-markdown-rendered="isCompleted ? 'true' : 'false'"
    @click.capture="handleMarkdownClick"
    v-html="html"
  ></div>
</template>

<script setup>
import {nextTick, onBeforeUnmount, ref, watch} from "vue";
import {renderMermaidInElement} from "@/utils/mermaidRenderer";
import {
  destroyMarkdownScrollbars,
  enhanceMarkdownScrollbars,
} from "@/platform/scroll/overlayScrollbarController";
import {resolveMermaidPlatformSettings} from "@/utils/mermaidPlatformSettings";
import {
  copyClipboardByPlatform,
  openExternalBrowser,
} from "@/platform/bridge/platformBridge";
import {usePlatformStore} from "@/stores/platformStore";

const props = defineProps({
  content: {type: String, default: ""},
  id: {type: String, default: ""},
  isReasoning: {type: Boolean, default: false},
  respObjId: {type: [String, Number], default: null},
});

const platformStore = usePlatformStore();
const markdownRef = ref(null);
const html = ref("");
const isCompleted = ref(false);
let alive = true;
let renderVersion = 0;

function escapeHtml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
    .replace(/\n/g, "<br>");
}

function hasMermaidContent(value = "") {
  return /```\s*mermaid|class=["'][^"']*\bmd-mermaid\b|data-mermaid-pending/i.test(
    String(value || "")
  );
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

function resolveMermaidSource(card) {
  const mermaid = card?.querySelector(".md-mermaid");
  return mermaid?.getAttribute("data-mermaid-source") || mermaid?.textContent || "";
}

function resolveMermaidSvg(card) {
  const svg = card?.querySelector(".md-mermaid svg");
  if (!svg) return "";
  const clone = svg.cloneNode(true);
  if (!clone.getAttribute("xmlns")) clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
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
      downloadText(`\ufeff${tableToCsv(table)}`, `table-${Date.now()}.csv`, "text/csv;charset=utf-8");
    }
    return;
  }

  const mermaidButton = event.target?.closest?.("button[data-md-mermaid-action]");
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
      if (svg) downloadText(svg, `mermaid-${Date.now()}.svg`, "image/svg+xml;charset=utf-8");
    }
    return;
  }

  const codeButton = event.target?.closest?.("button[data-md-code-action]");
  if (codeButton && root?.contains(codeButton)) {
    event.preventDefault();
    event.stopPropagation();
    const pre = codeButton.closest(".md-code-card")?.querySelector("pre");
    const code = pre?.getAttribute("data-md-code-source") || pre?.innerText || "";
    if (codeButton.dataset.mdCodeAction === "copy" && code) await copyClipboardByPlatform(code);
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

async function convertMarkdown() {
  const currentVersion = ++renderVersion;
  const element = markdownRef.value;

  try {
    const {renderMarkdown} = await import("@/utils/markdown");
    const settings = resolveMermaidPlatformSettings();
    const rendered = props.content
      ? await renderMarkdown(props.content, {
          renderMermaid: false,
          showMermaidHeader: settings.showMermaidHeader,
        })
      : "";
    if (!alive || currentVersion !== renderVersion) return;
    destroyMarkdownScrollbars(element);
    html.value = rendered;
    await nextTick();
    if (!alive || currentVersion !== renderVersion) return;

    if (settings.enableMermaidRendering && hasMermaidContent(props.content)) {
      await renderMermaidInElement(markdownRef.value);
    }
    if (!alive || currentVersion !== renderVersion) return;
    enhanceMarkdownScrollbars(markdownRef.value, {enabled: true});
  } catch {
    if (!alive || currentVersion !== renderVersion) return;
    destroyMarkdownScrollbars(element);
    html.value = escapeHtml(props.content || "");
  }
}

watch(
  () => props.content,
  async () => {
    if (isCompleted.value) {
      await convertMarkdown();
      return;
    }
    html.value = escapeHtml(props.content || "");
  },
  {immediate: true}
);

watch(
  () => props.respObjId,
  (newValue) => {
    if (newValue === 1) return;
    if (isCompleted.value) return;

    if (newValue) {
      nextTick(() => {
        window.setTimeout(async () => {
          if (isCompleted.value) return;
          isCompleted.value = true;
          await convertMarkdown();
        }, 0);
      });
    }
  },
  {immediate: true}
);

onBeforeUnmount(() => {
  alive = false;
  renderVersion += 1;
  destroyMarkdownScrollbars(markdownRef.value);
});
</script>
