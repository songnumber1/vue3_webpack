/**
 * @description 좌측 대화 목록 메뉴 액션을 실제 히스토리 API/팝업 액션으로 연결합니다.
 * @param {*} options - history action 의존성입니다.
 * @returns {{handleHistoryMenuAction: Function}} 메뉴 액션 핸들러입니다.
 */
export function useChatHistoryActions({t, toggleHistoryBookmark, openRenameDialog, openDeleteDialog, openNotice}) {
  async function handleHistoryMenuAction(payload = {}) {
    const {action, history} = payload;
    if (!history || !action) return;

    if (action === 'pin' || action === 'unpin') {
      await toggleHistoryBookmark(history);
      return;
    }

    if (action === 'rename') {
      openRenameDialog(history);
      return;
    }

    if (action === 'share') {
      openNotice(t('chat.historyMenu.shareNotice'));
      return;
    }

    if (action === 'delete') {
      openDeleteDialog(history);
    }
  }

  return {handleHistoryMenuAction};
}
