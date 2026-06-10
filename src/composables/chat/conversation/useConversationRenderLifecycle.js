import {nextTick, ref} from "vue";
import {renderMermaidInElement} from "@/utils/mermaidRenderer";
import {logWarn} from "@/utils/logger";
import {isProgressAllowedForCurrentPlatform} from "@/composables/progress/progressPolicy";

export function useConversationRenderLifecycle({
  ui,
  chatStore,
  apiRequestStore,
  systemSettingsStore,
  platformStore,
  activeHistoryId,
  isMermaidRenderingEnabled,
  messageRenderPolicy,
  navigationLock,
}) {
  const isHistoryRendering = ref(false);
  const historyMessagesLoaded = ref(false);
  let historyRenderOverlayActive = false;
  let historyRenderFinishSeq = 0;

  function waitForNextPaint() {
    if (typeof window === "undefined") return Promise.resolve();
    return new Promise((resolve) => {
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(resolve);
      });
    });
  }

  async function flushConversationSwitchPaint({
    messages,
    clearMessages = true,
  } = {}) {
    if (clearMessages && messages) {
      messages.value = [];
    }

    await nextTick();
    await waitForNextPaint();
  }

  function getCurrentChatHistoryLockOwner() {
    return String(
      activeHistoryId.value ||
        chatStore.pendingSelectedChatId ||
        chatStore.selectedChatId ||
        ""
    ).trim();
  }

  function releaseCurrentChatHistoryLock() {
    const lockEntry = navigationLock.getLock(
      navigationLock.NAVIGATION_LOCK_SCOPES.chatHistory
    );
    if (!lockEntry) return;

    const currentOwner = getCurrentChatHistoryLockOwner();
    if (currentOwner && lockEntry.owner === currentOwner) {
      navigationLock.releaseLock(
        navigationLock.NAVIGATION_LOCK_SCOPES.chatHistory,
        currentOwner
      );
      return;
    }

    if (
      !lockEntry.owner ||
      lockEntry.meta?.source === "useChatDataController"
    ) {
      navigationLock.releaseLock(
        navigationLock.NAVIGATION_LOCK_SCOPES.chatHistory
      );
    }
  }

  function forceReleaseChatHistoryLock() {
    navigationLock.releaseLock(
      navigationLock.NAVIGATION_LOCK_SCOPES.chatHistory
    );
  }

  function beginHistoryRender() {
    historyRenderFinishSeq += 1;
    historyMessagesLoaded.value = false;
    isHistoryRendering.value = true;
    navigationLock.acquireLockIfFree(
      navigationLock.NAVIGATION_LOCK_SCOPES.chatHistory,
      {
        owner: String(
          activeHistoryId.value || chatStore.pendingSelectedChatId || "route"
        ),
        reason: "history-render",
        meta: {source: "useChatDataController"},
      }
    );
    if (
      isProgressAllowedForCurrentPlatform(
        systemSettingsStore.settings,
        platformStore.info
      ) &&
      !historyRenderOverlayActive
    ) {
      apiRequestStore.startOverlay();
      historyRenderOverlayActive = true;
    }
  }

  function finishHistoryRenderImmediately() {
    historyRenderFinishSeq += 1;
    historyMessagesLoaded.value = false;
    isHistoryRendering.value = false;
    releaseCurrentChatHistoryLock();
    if (historyRenderOverlayActive) {
      apiRequestStore.stopOverlay();
    }
    historyRenderOverlayActive = false;
  }

  function finishHistoryRender() {
    const finishSeq = ++historyRenderFinishSeq;

    const revealAfterPaint = async () => {
      try {
        await nextTick();
        await waitForNextPaint();
        if (finishSeq !== historyRenderFinishSeq) return;

        isHistoryRendering.value = false;
        releaseCurrentChatHistoryLock();

        await nextTick();
        if (finishSeq !== historyRenderFinishSeq) return;
        await ui.scrollInitialTarget?.(messageRenderPolicy.value.scrollTarget, {
          behavior: "auto",
        });

        await waitForNextPaint();
        if (finishSeq !== historyRenderFinishSeq) return;
        await ui.scrollInitialTarget?.(messageRenderPolicy.value.scrollTarget, {
          behavior: "auto",
        });

        await waitForNextPaint();
        if (finishSeq !== historyRenderFinishSeq) return;
        await ui.scrollInitialTarget?.(messageRenderPolicy.value.scrollTarget, {
          behavior: "auto",
        });
      } finally {
        if (finishSeq === historyRenderFinishSeq) {
          historyMessagesLoaded.value = false;
          if (historyRenderOverlayActive) {
            apiRequestStore.stopOverlay();
          }
          historyRenderOverlayActive = false;
        }
      }
    };

    void revealAfterPaint();
  }

  async function renderAfterStream() {
    try {
      if (ui.autoScrollOnAnswer.value) {
        ui.markForceBottom(1000);
      }

      if (isMermaidRenderingEnabled()) {
        await renderMermaidInElement(document.querySelector(".message-list"), {
          force: true,
        });
      }

      if (ui.autoScrollOnAnswer.value) {
        ui.scrollBottom({force: true, stable: true, autoAnswer: true});
      }
    } catch (error) {
      logWarn(
        "[useConversationRenderLifecycle] renderAfterStream 오류:",
        error
      );
    }
  }

  function invalidateHistoryRender() {
    historyRenderFinishSeq += 1;
  }

  function cleanupHistoryRender() {
    invalidateHistoryRender();
    forceReleaseChatHistoryLock();
    if (historyRenderOverlayActive) {
      apiRequestStore.stopOverlay();
      historyRenderOverlayActive = false;
    }
  }

  return {
    isHistoryRendering,
    historyMessagesLoaded,
    waitForNextPaint,
    flushConversationSwitchPaint,
    beginHistoryRender,
    finishHistoryRender,
    finishHistoryRenderImmediately,
    renderAfterStream,
    invalidateHistoryRender,
    cleanupHistoryRender,
  };
}
