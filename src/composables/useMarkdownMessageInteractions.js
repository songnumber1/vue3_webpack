import {openExternalBrowser, copyClipboardByPlatform} from '@/services/platformBridge';
import {usePlatformStore} from '@/stores/platformStore';

function tableToText(table) {
  return Array.from(table.rows)
    .map((row) =>
      Array.from(row.cells)
        .map((cell) => cell.innerText.replace(/\s+/g, ' ').trim())
        .join('\t')
    )
    .join('\n');
}

function tableToCsv(table) {
  return Array.from(table.rows)
    .map((row) =>
      Array.from(row.cells)
        .map(
          (cell) =>
            `"${cell.innerText.replace(/"/g, '""').replace(/\s+/g, ' ').trim()}"`
        )
        .join(',')
    )
    .join('\n');
}

function downloadCsv(csv) {
  const blob = new Blob([`\ufeff${csv}`], {type: 'text/csv;charset=utf-8'});
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `table-${Date.now()}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

async function handleTableAction(button) {
  const card = button.closest('.md-table-card');
  const table = card?.querySelector('table');
  if (!table) return;

  const action = button.dataset.mdTableAction;
  if (action === 'copy') {
    await copyClipboardByPlatform(tableToText(table));
    return;
  }
  if (action === 'csv') {
    downloadCsv(tableToCsv(table));
  }
}

/**
 * Creates markdown click handler for AssistantMessage.vue.
 * @param {import('vue').Ref<HTMLElement|null>} contentRef Rendered markdown root.
 * @returns {{handleMarkdownClick: Function}}
 */
export function useMarkdownMessageInteractions(contentRef) {
  const platformStore = usePlatformStore();

  async function handleMarkdownClick(event) {
    const tableActionButton = event.target?.closest?.(
      'button[data-md-table-action]'
    );
    if (tableActionButton && contentRef.value?.contains(tableActionButton)) {
      event.preventDefault();
      event.stopPropagation();
      await handleTableAction(tableActionButton);
      return;
    }

    const anchor = event.target?.closest?.('a[href]');
    if (!anchor || !contentRef.value?.contains(anchor)) return;

    const href = anchor.getAttribute('href');
    if (!href || href.startsWith('#')) return;
    if (!platformStore.info.isAndroidApp) return;

    event.preventDefault();
    event.stopPropagation();
    await openExternalBrowser(anchor.href);
  }

  return {handleMarkdownClick};
}
