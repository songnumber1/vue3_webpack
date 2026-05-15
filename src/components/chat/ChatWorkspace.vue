<!--
@file ChatWorkspace.vue
@description Main chat workspace that renders header, main landing, messages and composer area.
@author OpenAI
-->

<template>
  <ChatHeader
    :mode="mode"
    :is-mobile="isMobile"
    :assistant-label="assistantLabel"
    :conversation-title="conversationTitle"
    :theme-name="themeName"
    @open-drawer="$emit('open-drawer')"
    @toggle-theme="$emit('toggle-theme')"
    @open-swagger="$emit('open-swagger')"
    @open-settings="$emit('open-settings')"
    @open-assistant="$emit('open-assistant')"
    @open-guide="$emit('open-guide')"
    @open-notice="$emit('open-notice')"
    @open-personalization="$emit('open-personalization')"
    @open-language="$emit('open-language')"
    @open-playground="$emit('open-playground')"
  />

  <section v-if="mode === 'main'" class="empty-stage empty-stage--main">
    <div class="empty-center">
      <h1>{{ t("chat.startQuestion") }}</h1>
      <div class="suggestion-row suggestion-row--between">
        <button
          v-for="item in suggestions"
          :key="item.text"
          class="suggestion-chip"
          type="button"
          @click="$emit('submit', item.prompt)"
        >
          <span>{{ item.icon }}</span
          >{{ item.text }}
        </button>
      </div>
      <PromptInput
        class="desktop-center-prompt"
        :model-value="selectedModel"
        :models="models"
        :disabled="isGenerating"
        :show-help="false"
        @update:model-value="$emit('update:selectedModel', $event)"
        @submit="$emit('submit', $event)"
        @focus="$emit('prompt-focus')"
        @height-change="$emit('prompt-resize', $event)"
      />
    </div>
  </section>

  <template v-else>
    <MessageList
      ref="listRef"
      :messages="messages"
      :loading="isGenerating"
      @content-rendered="$emit('message-content-rendered')"
    />
    <button
      v-if="showScrollBottom"
      class="scroll-bottom-button"
      type="button"
      :aria-label="t('chat.scrollBottom')"
      @click="$emit('scroll-bottom')"
    >
      ↓
    </button>
    <div ref="composerSlotRef" class="chat-composer-slot">
      <ChatReadonlyInput v-if="readonly" />
      <PromptInput
        v-else
        :model-value="selectedModel"
        :models="models"
        :disabled="isGenerating"
        :show-help="false"
        @update:model-value="$emit('update:selectedModel', $event)"
        @submit="$emit('submit', $event)"
        @focus="$emit('prompt-focus')"
        @height-change="$emit('prompt-resize', $event)"
      />
    </div>
  </template>
</template>

<script setup>
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import ChatHeader from "./ChatHeader.vue";
import ChatReadonlyInput from "./ChatReadonlyInput.vue";
import MessageList from "./MessageList.vue";
import PromptInput from "./PromptInput.vue";

const { t } = useI18n();
const listRef = ref(null);
const composerSlotRef = ref(null);
let composerResizeObserver = null;

/**
 * Updates the global composer height CSS variable used to position the scroll-to-bottom button.
 * @returns {void}
 */
function updateComposerHeight() {
  const height = composerSlotRef.value?.offsetHeight || 0;
  document.documentElement.style.setProperty(
    "--chat-composer-height",
    `${Math.max(height, 72)}px`,
  );
}

/**
 * Starts observing composer size changes so the floating bottom button never sits behind the input.
 * @returns {void}
 */
function observeComposerHeight() {
  if (!composerSlotRef.value) return;

  updateComposerHeight();

  if (typeof ResizeObserver !== "undefined") {
    composerResizeObserver = new ResizeObserver(updateComposerHeight);
    composerResizeObserver.observe(composerSlotRef.value);
  }
}

/**
 * Stops observing composer size changes and clears the observer reference.
 * @returns {void}
 */
function cleanupComposerHeightObserver() {
  composerResizeObserver?.disconnect();
  composerResizeObserver = null;
}

onMounted(async () => {
  await nextTick();
  observeComposerHeight();
});

onBeforeUnmount(cleanupComposerHeightObserver);

const props = defineProps({
  mode: { type: String, default: "main" },
  readonly: { type: Boolean, default: false },
  isMobile: { type: Boolean, default: false },
  assistantLabel: { type: String, default: "Assistant" },
  conversationTitle: { type: String, default: "" },
  themeName: { type: String, default: "light" },
  suggestions: { type: Array, default: () => [] },
  selectedModel: { type: String, default: "" },
  models: { type: Array, default: () => [] },
  isGenerating: { type: Boolean, default: false },
  messages: { type: Array, default: () => [] },
  showScrollBottom: { type: Boolean, default: false },
});

defineEmits([
  "update:selectedModel",
  "open-drawer",
  "toggle-theme",
  "open-swagger",
  "open-settings",
  "open-assistant",
  "open-guide",
  "open-notice",
  "open-personalization",
  "open-language",
  "open-playground",
  "submit",
  "prompt-focus",
  "prompt-resize",
  "message-content-rendered",
  "scroll-bottom",
]);

watch(
  () => [props.readonly, props.mode, props.showScrollBottom],
  async () => {
    await nextTick();
    updateComposerHeight();
  },
);

defineExpose({
  listRef,
});
</script>
