export function createMessageUserScrollIntentController({
  cancelManualHistoryAnchorLock,
  clearAfterRenderScrollState,
  clearHistoryRenderState,
  clearStableTimers,
  getIsHistoryRendering,
}) {
  function handleUserScrollIntent() {
    cancelManualHistoryAnchorLock();
    clearStableTimers();
    clearAfterRenderScrollState();
    if (!getIsHistoryRendering()) {
      clearHistoryRenderState();
    }
  }

  function addUserScrollIntentListeners(targetWindow = window) {
    if (!targetWindow) return;
    targetWindow.addEventListener("touchstart", handleUserScrollIntent, {
      passive: true,
    });
    targetWindow.addEventListener("wheel", handleUserScrollIntent, {
      passive: true,
    });
    targetWindow.addEventListener("keydown", handleUserScrollIntent);
  }

  function removeUserScrollIntentListeners(targetWindow = window) {
    if (!targetWindow) return;
    targetWindow.removeEventListener("touchstart", handleUserScrollIntent);
    targetWindow.removeEventListener("wheel", handleUserScrollIntent);
    targetWindow.removeEventListener("keydown", handleUserScrollIntent);
  }

  return {
    addUserScrollIntentListeners,
    handleUserScrollIntent,
    removeUserScrollIntentListeners,
  };
}
