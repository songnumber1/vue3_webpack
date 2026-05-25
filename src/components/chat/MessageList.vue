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
import {computed, nextTick, onBeforeUnmount, onMounted, ref} from "vue";
import ChatMessage from "./ChatMessage.vue";

const BOTTOM_THRESHOLD = 48;
const STABLE_SCROLL_DELAYS = [0, 32, 80, 160, 320, 520];
const KEYBOARD_SUBMIT_STABLE_SCROLL_DELAYS = [0, 80, 160, 320, 600, 900, 1300, 1800, 2300];

const props = defineProps({
  messages: {type: Array, required: true},
  loading: {type: Boolean, default: false},
  autoScrollOnAnswer: {type: Boolean, default: false},
});

const emit = defineEmits(["content-rendered", "regenerate"]);

const scrollRef = ref(null);
const bottomRef = ref(null);
const userIsAtBottom = ref(true);
let stableScrollTimerIds = [];
const streamFocusSpacerHeight = computed(() => {
  if (props.autoScrollOnAnswer || !props.loading) {
    return 0;
  }

  const viewportHeight =
    window.visualViewport?.height || window.innerHeight || 0;

  return Math.max(0, Math.floor(viewportHeight * 0.72));
});

function getScrollElement() {
  return scrollRef.value;
}
function isNearBottom() {
  const el = getScrollElement();
  if (!el) return true;

  const remaining = el.scrollHeight - el.scrollTop - el.clientHeight;

  return remaining <= BOTTOM_THRESHOLD;
}
function updateBottomState() {
  userIsAtBottom.value = isNearBottom();
}
function handleScroll() {
  updateBottomState();
}
function handleUserScrollIntent() {
  clearStableTimers();
}
function clearStableTimers() {
  stableScrollTimerIds.forEach((timerId) => window.clearTimeout(timerId));
  stableScrollTimerIds = [];
}
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

function getLatestUserMessageElement() {
  const el = getScrollElement();
  if (!el) return null;
  const userMessages = el.querySelectorAll(
    '[data-message-role="user"], article.message--user, .message--user'
  );
  return userMessages.length ? userMessages[userMessages.length - 1] : null;
}

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

function scrollToLatestUserMessage(options = {}) {
  clearStableTimers();

  const target = getLatestUserMessageElement();
  if (!applyElementScroll(target, options)) return;

  if (!options.stable) return;

  const delays = options.keyboardOpenOnSubmit
    ? KEYBOARD_SUBMIT_STABLE_SCROLL_DELAYS
    : STABLE_SCROLL_DELAYS;

  delays.forEach((delay) => {
    const timerId = window.setTimeout(() => {
      window.requestAnimationFrame(() => {
        applyElementScroll(target, {...options, behavior: "auto"});
      });
    }, delay);
    stableScrollTimerIds.push(timerId);
  });
}
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
async function handleMessageRendered() {
  emit("content-rendered");

  await nextTick();
  if (props.autoScrollOnAnswer) {
    scrollToBottom({stable: true});
  }
}

onMounted(() => {
  if (typeof window === "undefined") return;
  window.addEventListener("touchstart", handleUserScrollIntent, {passive: true});
  window.addEventListener("wheel", handleUserScrollIntent, {passive: true});
});

onBeforeUnmount(() => {
  clearStableTimers();
  if (typeof window === "undefined") return;
  window.removeEventListener("touchstart", handleUserScrollIntent);
  window.removeEventListener("wheel", handleUserScrollIntent);
});
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
