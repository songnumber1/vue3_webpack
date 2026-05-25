<template>
  <section
    ref="scrollRef"
    class="message-list"
    aria-live="polite"
    @scroll.passive="handleScroll"
    @touchstart.passive="handleUserScrollIntent"
    @wheel.passive="handleUserScrollIntent"
    @pointerdown.passive="handleUserScrollIntent"
  >
    <ChatMessage
      v-for="message in messages"
      :key="message.id"
      :message="message"
      :message-dom-id="String(message.id || '')"
      :message-dom-role="message.role"
      @rendered="handleMessageRendered"
      @regenerate="$emit('regenerate', $event)"
    />
    <div v-if="loading" class="typing-row">
      <span></span><span></span><span></span>
    </div>
    <div
      v-if="streamFocusSpacerHeight > 0"
      class="stream-focus-spacer"
      :style="{height: `${streamFocusSpacerHeight}px`}"
      aria-hidden="true"
    ></div>
    <div ref="bottomRef" class="message-list-anchor" aria-hidden="true"></div>
  </section>
</template>

<script setup>
/**
 * @file components/chat/MessageList.vue
 * @description 채팅 UI 컴포넌트입니다. 메시지, 헤더, 입력 영역, 이미지 프리뷰 등 실제 화면 렌더를 담당합니다.
 *
 * 프리징 코드 주석 기준:
 * - 이 주석은 코드 추적을 돕기 위한 설명이며 런타임 동작을 변경하지 않습니다.
 * - 함수/상태가 다른 composable, store, component로 전달되는 경우 호출 방향을 먼저 확인하세요.
 */

import {computed, nextTick, onBeforeUnmount, onMounted, ref} from "vue";
import ChatMessage from "./ChatMessage.vue";

/**
 * [모바일 질문 앵커/스크롤 보정]
 * 자동 스크롤 OFF 상태에서는 답변 chunk마다 하단으로 내리지 않고,
 * 전송 직후 마지막 사용자 질문 엘리먼트를 찾아 상단 근처로 이동합니다.
 *
 * 모바일 Chrome/WebView에서는 키보드가 내려가는 동안 visualViewport 높이가 여러 번 변하므로
 * 한 번의 scrollIntoView만으로는 실패할 수 있습니다. 그래서 stable delay 배열로 여러 번 보정합니다.
 * 사용자가 직접 scroll/touch/wheel/pointer를 시작하면 예약된 보정 타이머를 취소해 강제 복귀를 막습니다.
 */

const BOTTOM_THRESHOLD = 48;
const STABLE_SCROLL_DELAYS = [0, 32, 80, 160, 320, 520];
const KEYBOARD_SUBMIT_STABLE_SCROLL_DELAYS = [0, 80, 160, 320, 600, 900, 1300, 1800, 2300];

/**
 * 상위 컴포넌트에서 전달되는 렌더링/상태 제어 입력값입니다.
 */
const props = defineProps({
  messages: {type: Array, required: true},
  loading: {type: Boolean, default: false},
  autoScrollOnAnswer: {type: Boolean, default: false},
});

const emit = defineEmits(["content-rendered", "regenerate"]);

const scrollRef = ref(null);
const bottomRef = ref(null);
const userIsAtBottom = ref(true);
const viewportHeightForFocusSpacer = ref(0);
let stableScrollTimerIds = [];

/**
 * 자동 스크롤 OFF 상태에서 사용자 질문을 화면 상단으로 올리려면
 * 최신 질문 아래쪽에 충분한 빈 스크롤 영역이 필요합니다.
 * 실제 모바일 키보드가 열린 상태에서는 visualViewport.height가 작아지기 때문에
 * visualViewport 비율만 사용하면 spacer가 부족해져 이전 답변이 일부 남을 수 있습니다.
 */
function updateFocusSpacerViewportHeight() {
  const visualHeight = window.visualViewport?.height || 0;
  const layoutHeight = window.innerHeight || 0;
  const listHeight = scrollRef.value?.clientHeight || 0;

  viewportHeightForFocusSpacer.value = Math.max(
    visualHeight,
    listHeight,
    Math.floor(layoutHeight * 0.5)
  );
}

const streamFocusSpacerHeight = computed(() => {
  if (props.autoScrollOnAnswer || !props.loading) {
    return 0;
  }

  const viewportHeight = viewportHeightForFocusSpacer.value ||
    window.visualViewport?.height ||
    scrollRef.value?.clientHeight ||
    window.innerHeight ||
    0;
  const listHeight = scrollRef.value?.clientHeight || 0;
  const viewportBasedSpacer = Math.floor(viewportHeight * 0.92);
  const listBasedSpacer = Math.max(0, listHeight - 48);

  return Math.max(0, viewportBasedSpacer, listBasedSpacer);
});

/**
 * 현재 DOM, store, runtime 값에서 필요한 값을 조회합니다.
 */
function getScrollElement() {
  return scrollRef.value;
}
/**
 * 현재 상태가 특정 조건을 만족하는지 판단합니다.
 */
function isNearBottom() {
  const el = getScrollElement();
  if (!el) return true;

  const remaining = el.scrollHeight - el.scrollTop - el.clientHeight;

  return remaining <= BOTTOM_THRESHOLD;
}
/**
 * 현재 상태를 기준으로 reactive 값 또는 DOM 보조 값을 갱신합니다.
 */
function updateBottomState() {
  userIsAtBottom.value = isNearBottom();
}
/**
 * 사용자 이벤트 또는 하위 컴포넌트 emit을 받아 필요한 상태 변경/action을 실행합니다.
 */
function handleScroll() {
  updateBottomState();
}
/**
 * 사용자 이벤트 또는 하위 컴포넌트 emit을 받아 필요한 상태 변경/action을 실행합니다.
 */
function handleUserScrollIntent() {
  clearStableTimers();
}
/**
 * 이 모듈 내부의 세부 처리 단계입니다. 호출부에서 의미가 드러나지 않는 중간 로직을 캡슐화합니다.
 */
function clearStableTimers() {
  stableScrollTimerIds.forEach((timerId) => window.clearTimeout(timerId));
  stableScrollTimerIds = [];
}
/**
 * 계산된 설정 또는 사용자 선택 값을 실제 상태/DOM에 적용합니다.
 */
function applyBottomScroll(behavior = "auto") {
  const el = getScrollElement();
  if (!el) return;

  if (bottomRef.value?.scrollIntoView) {
    bottomRef.value.scrollIntoView({
      block: "end",
      inline: "nearest",
      behavior,
    });
  }

  el.scrollTop = el.scrollHeight;
  userIsAtBottom.value = true;
}

/**
 * 현재 DOM, store, runtime 값에서 필요한 값을 조회합니다.
 */
function getLatestUserMessageElement() {
  const el = getScrollElement();
  if (!el) return null;
  const userMessages = el.querySelectorAll(
    '[data-message-role="user"], article.message--user, .message--user'
  );
  return userMessages.length ? userMessages[userMessages.length - 1] : null;
}

/**
 * 현재 상태가 특정 조건을 만족하는지 판단합니다.
 */
function canElementScroll(element) {
  if (!element || element === document.body || element === document.documentElement)
    return false;
  const style = window.getComputedStyle(element);
  const overflowY = `${style.overflowY || ""} ${style.overflow || ""}`;
  return (
    /(auto|scroll)/.test(overflowY) &&
    element.scrollHeight > element.clientHeight + 1
  );
}

/**
 * 현재 DOM, store, runtime 값에서 필요한 값을 조회합니다.
 */
function getScrollableAncestors(target) {
  if (typeof window === "undefined" || typeof document === "undefined")
    return [];

  const result = [];
  let current = target?.parentElement || null;
  while (current && current !== document.body && current !== document.documentElement) {
    if (canElementScroll(current)) result.push(current);
    current = current.parentElement;
  }
  return result;
}

/**
 * 채팅/viewport scroll 위치를 보정합니다. 모바일 키보드 상태에 영향을 받을 수 있습니다.
 */
function scrollElementToTarget(container, target, options = {}) {
  if (!container || !target) return false;

  const behavior = options.behavior || "auto";
  const offset = Number.isFinite(options.offset) ? options.offset : 16;
  const containerRect = container.getBoundingClientRect();
  const targetRect = target.getBoundingClientRect();
  const nextTop =
    container.scrollTop + targetRect.top - containerRect.top - offset;

  if (typeof container.scrollTo === "function") {
    container.scrollTo({top: Math.max(0, nextTop), behavior});
  } else {
    container.scrollTop = Math.max(0, nextTop);
  }
  return true;
}

/**
 * 계산된 설정 또는 사용자 선택 값을 실제 상태/DOM에 적용합니다.
 */
function applyWindowFallbackScroll(target, containerRect, options = {}) {
  if (!options.pageFallback || typeof window === "undefined") return;

  const behavior = options.behavior || "auto";
  const offset = Number.isFinite(options.offset) ? options.offset : 16;
  const targetRect = target.getBoundingClientRect();
  const viewportTop = containerRect?.top || 0;
  const delta = targetRect.top - viewportTop - offset;

  if (Math.abs(delta) < 1) return;
  window.scrollBy({top: delta, behavior});
}

/**
 * 계산된 설정 또는 사용자 선택 값을 실제 상태/DOM에 적용합니다.
 */
function applyElementScroll(target, options = {}) {
  const el = getScrollElement();
  if (!el || !target) return false;

  const ancestors = getScrollableAncestors(target);
  const scrollTargets = [el, ...ancestors].filter(
    (item, index, array) => item && array.indexOf(item) === index
  );

  let applied = false;
  scrollTargets.forEach((container) => {
    applied = scrollElementToTarget(container, target, options) || applied;
  });

  applyWindowFallbackScroll(target, el.getBoundingClientRect(), options);
  updateBottomState();
  return applied;
}

/**
 * 채팅/viewport scroll 위치를 보정합니다. 모바일 키보드 상태에 영향을 받을 수 있습니다.
 */
function scrollToLatestUserMessage(options = {}) {
  clearStableTimers();
  updateFocusSpacerViewportHeight();

  const target = getLatestUserMessageElement();
  if (!applyElementScroll(target, options)) return;

  if (!options.stable) return;

  const delays = options.keyboardOpenOnSubmit
    ? KEYBOARD_SUBMIT_STABLE_SCROLL_DELAYS
    : STABLE_SCROLL_DELAYS;

  delays.forEach((delay) => {
    const timerId = window.setTimeout(() => {
      window.requestAnimationFrame(() => {
        updateFocusSpacerViewportHeight();
        applyElementScroll(target, {...options, behavior: "auto"});
      });
    }, delay);
    stableScrollTimerIds.push(timerId);
  });
}
/**
 * 채팅/viewport scroll 위치를 보정합니다. 모바일 키보드 상태에 영향을 받을 수 있습니다.
 */
function scrollToBottom(options = {}) {
  const force = options.force === true;
  const stable = options.stable === true;
  const behavior = options.behavior || "auto";

  if (!force && !userIsAtBottom.value) {
    return;
  }

  clearStableTimers();
  applyBottomScroll(behavior);

  if (!stable) return;

  STABLE_SCROLL_DELAYS.forEach((delay) => {
    const timerId = window.setTimeout(() => {
      applyBottomScroll("auto");
    }, delay);
    stableScrollTimerIds.push(timerId);
  });
}
/**
 * 사용자 이벤트 또는 하위 컴포넌트 emit을 받아 필요한 상태 변경/action을 실행합니다.
 */
async function handleMessageRendered() {
  emit("content-rendered");

  await nextTick();
  if (props.autoScrollOnAnswer) {
    scrollToBottom({stable: true});
  }
}

onMounted(() => {
  if (typeof window === "undefined") return;
  updateFocusSpacerViewportHeight();
  window.addEventListener("resize", updateFocusSpacerViewportHeight, {passive: true});
  window.visualViewport?.addEventListener("resize", updateFocusSpacerViewportHeight, {
    passive: true,
  });
  window.addEventListener("touchstart", handleUserScrollIntent, {passive: true});
  window.addEventListener("wheel", handleUserScrollIntent, {passive: true});
});

onBeforeUnmount(() => {
  clearStableTimers();
  if (typeof window === "undefined") return;
  window.removeEventListener("resize", updateFocusSpacerViewportHeight);
  window.visualViewport?.removeEventListener(
    "resize",
    updateFocusSpacerViewportHeight
  );
  window.removeEventListener("touchstart", handleUserScrollIntent);
  window.removeEventListener("wheel", handleUserScrollIntent);
});
/**
 * 현재 DOM, store, runtime 값에서 필요한 값을 조회합니다.
 */
function getIsAtBottom() {
  updateBottomState();

  return userIsAtBottom.value;
}

defineExpose({
  scrollToBottom,
  scrollToLatestUserMessage,
  isAtBottom: getIsAtBottom,
  getScrollElement,
});
</script>

<style scoped>
.message-list {
  min-width: 0;
  min-height: 0;
}

.message-list-anchor {
  width: 100%;
  height: 1px;
  pointer-events: none;
}

.typing-row {
  flex: 0 0 auto;
}
.stream-focus-spacer {
  flex: 0 0 auto;
  width: 100%;
  pointer-events: none;
}

</style>
