/**
 * @file composables/chat/container/useChatScrollController.js
 * @description ChatContainer 전용 controller 계층입니다. route, UI 상태, scroll, modal, submit 흐름을 도메인별 composable로 조립합니다.
 *
 * 프리징 코드 주석 기준:
 * - 이 주석은 코드 추적을 돕기 위한 설명이며 런타임 동작을 변경하지 않습니다.
 * - 함수/상태가 다른 composable, store, component로 전달되는 경우 호출 방향을 먼저 확인하세요.
 */

import {ref} from "vue";

export function useChatScrollController({
  isConversationPage,
  workspaceRef,
  scrollToBottom,
  autoScrollEnabled = {value: true},
}) {
  const showScrollBottom = ref(false);
  let bottomStateTimer = 0;
  let forceBottomUntil = 0;
  let latestUserScrollTimerIds = [];

  function getMessageListRef() {
    const exposed = workspaceRef.value?.listRef;
    if (exposed?.scrollToBottom || exposed?.scrollToLatestUserMessage) {
      return exposed;
    }
    if (
      exposed?.value?.scrollToBottom ||
      exposed?.value?.scrollToLatestUserMessage
    ) {
      return exposed.value;
    }
    return null;
  }

  function markForceBottom(duration = 1800) {
    forceBottomUntil = Date.now() + duration;
  }

  function clearForceBottom() {
    forceBottomUntil = 0;
  }

  function clearLatestUserScrollTimers() {
    latestUserScrollTimerIds.forEach((timerId) => window.clearTimeout(timerId));
    latestUserScrollTimerIds = [];
  }

  function shouldKeepForceBottom() {
    return Boolean(autoScrollEnabled?.value) && Date.now() <= forceBottomUntil;
  }

  async function scrollBottom(options = {}) {
    if (options.autoAnswer && !autoScrollEnabled?.value) {
      updateScrollBottomButton();
      return;
    }
    const list = getMessageListRef();
    if (list?.scrollToBottom) {
      list.scrollToBottom(options);
    } else {
      await scrollToBottom(options);
    }
    updateScrollBottomButton();
  }

  async function scrollLatestUserMessage(options = {}) {
    clearLatestUserScrollTimers();

    const apply = () => {
      const list = getMessageListRef();
      if (!list?.scrollToLatestUserMessage) return false;
      list.scrollToLatestUserMessage({
        stable: true,
        ...options,
      });
      updateScrollBottomButton();
      return true;
    };

    if (apply()) return;

    [0, 32, 80, 160, 320].forEach((delay) => {
      const timerId = window.setTimeout(apply, delay);
      latestUserScrollTimerIds.push(timerId);
    });
  }


  function updateScrollBottomButton() {
    const list = getMessageListRef();
    showScrollBottom.value =
      Boolean(isConversationPage?.value) &&
      Boolean(list && !list.isAtBottom?.());
  }

  function scheduleBottomStateCheck() {
    window.clearTimeout(bottomStateTimer);
    bottomStateTimer = window.setTimeout(updateScrollBottomButton, 80);
  }

  function handleMessageContentRendered() {
    if (shouldKeepForceBottom())
      scrollBottom({force: true, stable: true, autoAnswer: true});
    scheduleBottomStateCheck();
  }

  function cleanupScrollController() {
    window.clearTimeout(bottomStateTimer);
    clearLatestUserScrollTimers();
  }

  return {
    showScrollBottom,
    markForceBottom,
    clearForceBottom,
    scrollBottom,
    scrollLatestUserMessage,
    scheduleBottomStateCheck,
    handleMessageContentRendered,
    cleanupScrollController,
  };
}
