import {
  openExternalBrowser,
  copyClipboardByPlatform,
} from "@/services/platformBridge";
import {usePlatformStore} from "@/stores/platformStore";

// 모듈 의존성을 모두 불러온 뒤, 아래에서 화면 상태와 실행 로직을 구성합니다.
/**
 * @description tableToText 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {*} table - table 입력값입니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
function tableToText(table) {
  // 계산된 결과를 호출부로 반환합니다.
  return Array.from(table.rows)
    .map((row) =>
      Array.from(row.cells)
        .map((cell) => cell.innerText.replace(/\s+/g, " ").trim())
        .join("\t")
    )
    .join("\n");
}

/**
 * @description tableToCsv 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {*} table - table 입력값입니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
function tableToCsv(table) {
  // 계산된 결과를 호출부로 반환합니다.
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
 * @description downloadCsv 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {*} csv - csv 입력값입니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
function downloadCsv(csv) {
  const blob = new Blob([`\ufeff${csv}`], {type: "text/csv;charset=utf-8"});
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
 * @description handleTableAction 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {*} button - button 입력값입니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
async function handleTableAction(button) {
  const card = button.closest(".md-table-card");
  const table = card?.querySelector("table");
  // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
  if (!table) return;

  const action = button.dataset.mdTableAction;
  // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
  if (action === "copy") {
    await copyClipboardByPlatform(tableToText(table));
    return;
  }
  // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
  if (action === "csv") {
    downloadCsv(tableToCsv(table));
  }
}

/**
 * @description useMarkdownMessageInteractions 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {*} contentRef - contentRef 입력값입니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
export function useMarkdownMessageInteractions(contentRef) {
  const platformStore = usePlatformStore();

  /**
   * @description handleMarkdownClick 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
   * @param {*} event - event 입력값입니다.
   * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
   */
  async function handleMarkdownClick(event) {
    const tableActionButton = event.target?.closest?.(
      "button[data-md-table-action]"
    );
    // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
    if (tableActionButton && contentRef.value?.contains(tableActionButton)) {
      event.preventDefault();
      event.stopPropagation();
      await handleTableAction(tableActionButton);
      return;
    }

    const anchor = event.target?.closest?.("a[href]");
    // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
    if (!anchor || !contentRef.value?.contains(anchor)) return;

    const href = anchor.getAttribute("href");
    // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
    if (!href || href.startsWith("#")) return;
    // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
    if (!platformStore.info.isAndroidApp) return;

    event.preventDefault();
    event.stopPropagation();
    await openExternalBrowser(anchor.href);
  }

  // 계산된 결과를 호출부로 반환합니다.
  return {handleMarkdownClick};
}
