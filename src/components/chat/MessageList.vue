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
      :interaction-blocked="interactionBlocked"
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
  interactionBlocked: {type: Boolean, default: false},
  autoScrollOnAnswer: {type: Boolean, default: false},
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
    bottomRef.value.scrollIntoView({
      block: "end",
      inline: "nearest",
      behavior,
    });
  }

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
</style>
