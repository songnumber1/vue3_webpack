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

  <section
    v-if="mode === 'main'"
    class="empty-stage empty-stage--main"
    :class="{'empty-stage--mobile-main': isMobile}"
  >
    <div class="empty-center">
      <h1>{{ t("chat.startQuestion") }}</h1>
      <div class="suggestion-row suggestion-row--between">
        <button
          v-for="item in suggestions"
          :key="item.id || item.text"
          class="suggestion-chip"
          type="button"
          :title="item.title || item.prompt"
          @click="$emit('submit', item.prompt)"
        >
          <span v-if="item.icon" aria-hidden="true">{{ item.icon }}</span>
          <span class="suggestion-chip-text">{{ item.text }}</span>
        </button>
      </div>
      <PromptInput
        v-if="!isMobile"
        :is-mobile="false"
        class="desktop-center-prompt"
        :floating="false"
        :model-value="selectedModel"
        :models="models"
        :disabled="isGenerating"
        :model-readonly="modelReadonly"
        :show-help="false"
        @update:model-value="$emit('update:selectedModel', $event)"
        @submit="$emit('submit', $event)"
        @focus="$emit('prompt-focus')"
        @height-change="$emit('prompt-resize', $event)"
      />
    </div>
    <PromptInput
      v-if="isMobile"
      :is-mobile="true"
      class="mobile-main-fixed-prompt"
      :floating="false"
      :model-value="selectedModel"
      :models="models"
      :disabled="isGenerating"
      :model-readonly="modelReadonly"
      :show-help="false"
      @update:model-value="$emit('update:selectedModel', $event)"
      @submit="$emit('submit', $event)"
      @focus="$emit('prompt-focus')"
      @height-change="$emit('prompt-resize', $event)"
    />
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
      <ChatReadonlyInput
        v-else-if="isActiveModelUnavailable"
        :variant="isActiveModelDeleted ? 'deleted-model' : 'unavailable-model'"
      />
      <PromptInput
        v-else
        :is-mobile="isMobile"
        :model-value="selectedModel"
        :models="models"
        :disabled="isGenerating"
        :model-readonly="modelReadonly"
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
import {nextTick, onBeforeUnmount, onMounted, ref, watch} from "vue";
import {useI18n} from "vue-i18n";
import ChatHeader from "./ChatHeader.vue";
import ChatReadonlyInput from "./ChatReadonlyInput.vue";
import MessageList from "./MessageList.vue";
import PromptInput from "@/components/prompt/PromptInput.vue";

// 모듈 의존성을 모두 불러온 뒤, 아래에서 화면 상태와 실행 로직을 구성합니다.
const {t} = useI18n();
const listRef = ref(null);
const composerSlotRef = ref(null);
let composerResizeObserver = null;

/**
 * @description updateComposerHeight 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {void} voidParam - 별도 입력값 없이 실행됩니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
function updateComposerHeight() {
  const height = composerSlotRef.value?.offsetHeight || 0;
  document.documentElement.style.setProperty(
    "--chat-composer-height",
    `${Math.max(height, 72)}px`
  );
}

/**
 * @description observeComposerHeight 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {void} voidParam - 별도 입력값 없이 실행됩니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
function observeComposerHeight() {
  // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
  if (!composerSlotRef.value) return;

  updateComposerHeight();

  // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
  if (typeof ResizeObserver !== "undefined") {
    composerResizeObserver = new ResizeObserver(updateComposerHeight);
    composerResizeObserver.observe(composerSlotRef.value);
  }
}

/**
 * @description cleanupComposerHeightObserver 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {void} voidParam - 별도 입력값 없이 실행됩니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
function cleanupComposerHeightObserver() {
  composerResizeObserver?.disconnect();
  composerResizeObserver = null;
}

// Vue 반응형 실행 구간입니다. 상태 변경과 생명주기 흐름을 이 영역에서 연결합니다.
onMounted(async () => {
  await nextTick();
  observeComposerHeight();
});

// Vue 반응형 실행 구간입니다. 상태 변경과 생명주기 흐름을 이 영역에서 연결합니다.
onBeforeUnmount(cleanupComposerHeightObserver);

const props = defineProps({
  mode: {type: String, default: "main"},
  readonly: {type: Boolean, default: false},
  isMobile: {type: Boolean, default: false},
  assistantLabel: {type: String, default: "Assistant"},
  conversationTitle: {type: String, default: ""},
  themeName: {type: String, default: "light"},
  suggestions: {type: Array, default: () => []},
  selectedModel: {type: String, default: ""},
  models: {type: Array, default: () => []},
  modelReadonly: {type: Boolean, default: false},
  isActiveModelDeleted: {type: Boolean, default: false},
  isActiveModelUnavailable: {type: Boolean, default: false},
  isGenerating: {type: Boolean, default: false},
  messages: {type: Array, default: () => []},
  showScrollBottom: {type: Boolean, default: false},
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

// Vue 반응형 실행 구간입니다. 상태 변경과 생명주기 흐름을 이 영역에서 연결합니다.
watch(
  () => [
    props.readonly,
    props.mode,
    props.showScrollBottom,
    props.isActiveModelUnavailable,
  ],
  async () => {
    await nextTick();
    updateComposerHeight();
  }
);

defineExpose({
  listRef,
});
</script>
