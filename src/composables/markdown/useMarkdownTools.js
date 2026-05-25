/**
 * @file composables/markdown/useMarkdownTools.js
 * @description Markdown 내부 버튼/링크/도구 action을 담당하는 composable입니다.
 *
 * 프리징 코드 주석 기준:
 * - 이 주석은 코드 추적을 돕기 위한 설명이며 런타임 동작을 변경하지 않습니다.
 * - 함수/상태가 다른 composable, store, component로 전달되는 경우 호출 방향을 먼저 확인하세요.
 */

import {
  openExternalBrowser,
  copyClipboardByPlatform,
} from "@/platform/bridge/platformBridge";
import {usePlatformStore} from "@/stores/platformStore";

/**
 * 이 모듈 내부의 세부 처리 단계입니다. 호출부에서 의미가 드러나지 않는 중간 로직을 캡슐화합니다.
 */
function tableToText(table) {
  return Array.from(table.rows)
    .map((row) =>
      Array.from(row.cells)
        .map((cell) => cell.innerText.replace(/\s+/g, " ").trim())
        .join("\t")
    )
    .join("\n");
}
/**
 * 이 모듈 내부의 세부 처리 단계입니다. 호출부에서 의미가 드러나지 않는 중간 로직을 캡슐화합니다.
 */
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
/**
 * 이 모듈 내부의 세부 처리 단계입니다. 호출부에서 의미가 드러나지 않는 중간 로직을 캡슐화합니다.
 */
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
/**
 * 이 모듈 내부의 세부 처리 단계입니다. 호출부에서 의미가 드러나지 않는 중간 로직을 캡슐화합니다.
 */
function downloadCsv(csv) {
  downloadText(
    `\ufeff${csv}`,
    `table-${Date.now()}.csv`,
    "text/csv;charset=utf-8"
  );
}
/**
 * 사용자 이벤트 또는 하위 컴포넌트 emit을 받아 필요한 상태 변경/action을 실행합니다.
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
 * 현재 runtime, route, 설정 값에 따라 사용할 값을 결정합니다.
 */
function resolveMermaidSource(card) {
  const mermaid = card?.querySelector(".md-mermaid");
  return (
    mermaid?.getAttribute("data-mermaid-source") || mermaid?.textContent || ""
  );
}
/**
 * 현재 runtime, route, 설정 값에 따라 사용할 값을 결정합니다.
 */
function resolveMermaidSvg(card) {
  const svg = card?.querySelector(".md-mermaid svg");
  if (!svg) return "";
  const clone = svg.cloneNode(true);
  if (!clone.getAttribute("xmlns")) {
    clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  }
  return new XMLSerializer().serializeToString(clone);
}
/**
 * 사용자 이벤트 또는 하위 컴포넌트 emit을 받아 필요한 상태 변경/action을 실행합니다.
 */
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

/**
 * 사용자 이벤트 또는 하위 컴포넌트 emit을 받아 필요한 상태 변경/action을 실행합니다.
 */
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
