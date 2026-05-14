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
  />

  <section v-if="mode === 'main'" class="empty-stage empty-stage--main">
    <div class="empty-center">
      <h1>어디서부터 시작할까요?</h1>
      <div class="suggestion-row suggestion-row--between">
        <button
          v-for="item in suggestions"
          :key="item.text"
          class="suggestion-chip"
          type="button"
          @click="$emit('submit', item.prompt)"
        >
          <span>{{ item.icon }}</span>{{ item.text }}
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
      aria-label="맨 아래로 이동"
      @click="$emit('scroll-bottom')"
    >
      ↓
    </button>
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
  </template>
</template>

<script setup>
import {ref} from "vue";
import ChatHeader from "./ChatHeader.vue";
import ChatReadonlyInput from "./ChatReadonlyInput.vue";
import MessageList from "./MessageList.vue";
import PromptInput from "./PromptInput.vue";

const listRef = ref(null);

defineProps({
  mode: {type: String, default: "main"},
  readonly: {type: Boolean, default: false},
  isMobile: {type: Boolean, default: false},
  assistantLabel: {type: String, default: "Assistant"},
  conversationTitle: {type: String, default: ""},
  themeName: {type: String, default: "light"},
  suggestions: {type: Array, default: () => []},
  selectedModel: {type: String, default: ""},
  models: {type: Array, default: () => []},
  isGenerating: {type: Boolean, default: false},
  messages: {type: Array, default: () => []},
  showScrollBottom: {type: Boolean, default: false}
});

defineEmits([
  "update:selectedModel",
  "open-drawer",
  "toggle-theme",
  "open-swagger",
  "open-settings",
  "open-assistant",
  "submit",
  "prompt-focus",
  "prompt-resize",
  "message-content-rendered",
  "scroll-bottom"
]);

defineExpose({
  listRef
});
</script>
