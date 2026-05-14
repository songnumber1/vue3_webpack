/** * @file MessageList.vue * @description Vue component used in the chat web
application runtime. * @author OpenAI */

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
      @rendered="handleMessageRendered"
    />
    <div v-if="loading" class="typing-row">
      <span></span><span></span><span></span>
    </div>
    <div ref="bottomRef" class="message-list-anchor" aria-hidden="true"></div>
  </section>
</template>

<script setup>
import {nextTick, onBeforeUnmount, ref} from "vue";
import ChatMessage from "./ChatMessage.vue";

const BOTTOM_THRESHOLD = 48;
const STABLE_SCROLL_DELAYS = [0, 32, 80, 160, 320, 520];

const props = defineProps({
  messages: {type: Array, required: true},
  loading: {type: Boolean, default: false},
});

const emit = defineEmits(["content-rendered"]);

const scrollRef = ref(null);
const bottomRef = ref(null);
const userIsAtBottom = ref(true);
let stableScrollTimerIds = [];

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
    bottomRef.value.scrollIntoView({block: "end", inline: "nearest", behavior});
  }

  // Direct assignment is kept as a fallback and as an Android Chrome correction.
  // Some delayed Markdown/Mermaid layouts update scrollHeight after scrollIntoView.
  el.scrollTop = el.scrollHeight;
  userIsAtBottom.value = true;
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
  // If the user is already at the bottom, keep the bottom anchored after late
  // Markdown, code highlight, image, or Mermaid layout changes. If the user has
  // scrolled up, this does nothing and preserves their reading position.
  scrollToBottom({stable: true});
}

onBeforeUnmount(clearStableTimers);

function getIsAtBottom() {
  updateBottomState();
  return userIsAtBottom.value;
}

defineExpose({
  scrollToBottom,
  isAtBottom: getIsAtBottom,
  getScrollElement,
});
</script>
