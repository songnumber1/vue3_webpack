<template>
  <section
    ref="scrollRef"
    class="message-list"
    aria-live="polite"
    @scroll.passive="handleScroll"
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
import {computed, nextTick, onBeforeUnmount, ref} from "vue";
import ChatMessage from "./ChatMessage.vue";

const BOTTOM_THRESHOLD = 48;
const STABLE_SCROLL_DELAYS = [0, 32, 80, 160, 320, 520];

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
  const userMessages = el.querySelectorAll('[data-message-role="user"]');
  return userMessages.length ? userMessages[userMessages.length - 1] : null;
}

function applyElementScroll(target, options = {}) {
  const el = getScrollElement();
  if (!el || !target) return false;

  const behavior = options.behavior || "auto";
  const offset = Number.isFinite(options.offset) ? options.offset : 16;
  const containerRect = el.getBoundingClientRect();
  const targetRect = target.getBoundingClientRect();
  const nextTop = el.scrollTop + targetRect.top - containerRect.top - offset;

  el.scrollTo({
    top: Math.max(0, nextTop),
    behavior,
  });
  updateBottomState();
  return true;
}

function scrollToLatestUserMessage(options = {}) {
  clearStableTimers();

  const target = getLatestUserMessageElement();
  if (!applyElementScroll(target, options)) return;

  if (!options.stable) return;

  STABLE_SCROLL_DELAYS.forEach((delay) => {
    const timerId = window.setTimeout(() => {
      applyElementScroll(target, {...options, behavior: "auto"});
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

onBeforeUnmount(clearStableTimers);
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
