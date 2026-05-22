import {
  openExternalBrowser,
  copyClipboardByPlatform,
} from "@/services/platformBridge";
import {usePlatformStore} from "@/stores/platformStore";

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
async function handleMermaidAction(button) {
  const card = button.closest(".md-mermaid-card");
  if (!card) return;

  const action = button.dataset.mdMermaidAction;
  if (action === "copy") {
    const source = resolveMermaidSource(card);
    if (source) {
      await copyClipboardByPlatform(source);
    }
    return;
  }

  if (action === "code") {
    const source = resolveMermaidSource(card);
    if (source) {
      downloadText(source, `mermaid-${Date.now()}.mmd`);
    }
    return;
  }

  if (action === "svg") {
    const svg = resolveMermaidSvg(card);
    if (svg) {
      downloadText(
        svg,
        `mermaid-${Date.now()}.svg`,
        "image/svg+xml;charset=utf-8"
      );
    }
  }
}

async function handleCodeAction(button) {
  const card = button.closest(".md-code-card");
  const pre = card?.querySelector("pre");
  const code = pre?.getAttribute("data-md-code-source") || pre?.innerText || "";
  const action = button.dataset.mdCodeAction;
  if (action === "copy" && code) {
    await copyClipboardByPlatform(code);
  }
}

export function useMarkdownTools(contentRef) {
  const platformStore = usePlatformStore();
  async function handleMarkdownClick(event) {
    const tableActionButton = event.target?.closest?.(
      "button[data-md-table-action]"
    );
    if (tableActionButton && contentRef.value?.contains(tableActionButton)) {
      event.preventDefault();
      event.stopPropagation();
      await handleTableAction(tableActionButton);
      return;
    }

    const mermaidActionButton = event.target?.closest?.(
      "button[data-md-mermaid-action]"
    );
    if (
      mermaidActionButton &&
      contentRef.value?.contains(mermaidActionButton)
    ) {
      event.preventDefault();
      event.stopPropagation();
      await handleMermaidAction(mermaidActionButton);
      return;
    }

    const codeActionButton = event.target?.closest?.(
      "button[data-md-code-action]"
    );
    if (codeActionButton && contentRef.value?.contains(codeActionButton)) {
      event.preventDefault();
      event.stopPropagation();
      await handleCodeAction(codeActionButton);
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

  return {handleMarkdownClick};
}
