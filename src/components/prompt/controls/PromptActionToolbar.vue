<template>
  <component
    :is="resolvedToolbarComponent"
    ref="toolbarComponentRef"
    v-bind="toolbarProps"
    @open-model="$emit('open-model')"
    @open-tool="$emit('open-tool')"
    @open-attach="$emit('open-attach')"
    @select-model="$emit('select-model', $event)"
    @apply-tool="$emit('apply-tool', $event)"
    @open-file-picker="$emit('open-file-picker', $event)"
    @start-voice="$emit('start-voice')"
    @stop-voice="$emit('stop-voice')"
  />
</template>

<script setup>
import {computed, ref} from "vue";
import {storeToRefs} from "pinia";
import PromptToolbarDesktop from "@/components/prompt/controls/PromptToolbarDesktop.vue";
import PromptToolbarMobile from "@/components/prompt/controls/PromptToolbarMobile.vue";
import {useChatStreamStore} from "@/stores/chatStreamStore";

const props = defineProps({
  disabled: {type: Boolean, default: false},
  modelReadonly: {type: Boolean, default: false},
  modelValue: {type: String, default: ""},
  currentModel: {type: Object, required: true},
  models: {type: Array, default: () => []},
  tools: {type: Array, default: () => []},
  attachOptions: {type: Array, default: () => []},
  modelMenuOpen: {type: Boolean, default: false},
  toolMenuOpen: {type: Boolean, default: false},
  attachMenuOpen: {type: Boolean, default: false},
  isMobileSheet: {type: Boolean, default: false},
  canSubmit: {type: Boolean, default: false},
  hasPromptText: {type: Boolean, default: false},
  isMicEnabled: {type: Boolean, default: false},
  isVoiceListening: {type: Boolean, default: false},
  hasVoiceStopped: {type: Boolean, default: false},
  generating: {type: Boolean, default: false},
  isSpeechSupported: {type: Boolean, default: true},
  voiceStartLabel: {type: String, default: "Start voice input"},
  voiceStopLabel: {type: String, default: "Stop voice input"},
  attachLabel: {type: String, default: "Attach"},
  sendLabel: {type: String, default: "Send"},
  modelSelectLabel: {type: String, default: "Select model"},
  readonlyTitle: {type: String, default: ""},
});

defineEmits([
  "open-model",
  "open-tool",
  "open-attach",
  "select-model",
  "apply-tool",
  "open-file-picker",
  "start-voice",
  "stop-voice",
]);

const chatStreamStore = useChatStreamStore();
const {isStreaming} = storeToRefs(chatStreamStore);

const toolbarComponentRef = ref(null);
const resolvedToolbarComponent = computed(() =>
  props.isMobileSheet ? PromptToolbarMobile : PromptToolbarDesktop
);
const toolbarProps = computed(() => ({
  ...props,
  generating: props.generating || isStreaming.value,
}));

const modelRoot = computed(() => toolbarComponentRef.value?.modelRoot || null);
const toolRoot = computed(() => toolbarComponentRef.value?.toolRoot || null);
const attachRoot = computed(() => toolbarComponentRef.value?.attachRoot || null);

defineExpose({modelRoot, toolRoot, attachRoot});
</script>
