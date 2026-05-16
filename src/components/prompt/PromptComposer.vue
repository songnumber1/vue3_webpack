<!--
@file PromptComposer.vue
@description Shared prompt composer controller. It owns prompt state and delegates textarea, toolbar, attachment preview and mobile sheet rendering to small components.
-->

<template>
  <footer class="prompt-wrap" :class="{'prompt-wrap--floating': floating}">
    <form class="prompt-box prompt-box--gemini" @submit.prevent="submit">
      <PromptAttachmentPreviewList
        :attachments="attachments"
        @preview="previewImage"
        @remove="removeAttachment"
        @preview-error="markPreviewError"
      />

      <PromptTextarea
        ref="textareaComponentRef"
        v-model="text"
        :disabled="disabled"
        :placeholder="placeholder || t('chat.promptPlaceholder')"
        @focus="handleFocus"
        @blur="emit('blur')"
        @input="resize"
        @submit="submit"
        @paste="handlePaste"
      />

      <PromptActionToolbar
        ref="toolbarRef"
        :disabled="disabled"
        :model-readonly="modelReadonly"
        :model-value="modelValue"
        :current-model="currentModel"
        :models="currentModels"
        :tools="tools"
        :model-menu-open="modelMenuOpen"
        :tool-menu-open="toolMenuOpen"
        :attach-menu-open="attachMenuOpen"
        :is-mobile-sheet="isMobileSheet"
        :show-camera-menu="showCameraMenu"
        :can-submit="canSubmit"
        :attach-label="t('chat.attach')"
        :send-label="t('chat.send')"
        :model-select-label="t('chat.modelSelect')"
        :readonly-title="t('chat.modelReadonly')"
        @open-model="openModelSelector"
        @open-tool="openToolSelector"
        @open-attach="openAttachSelector"
        @select-model="selectModel"
        @apply-tool="applyTool"
        @open-file-picker="openFilePicker"
      />

      <input
        ref="fileInputRef"
        class="visually-hidden-file-input"
        type="file"
        multiple
        :accept="fileAccept"
        :capture="captureMode"
        @change="handleFileChange"
      />
    </form>
    <p v-if="showHelp" class="prompt-help">
      UI demo. Extend resolver/api.js for production integration.
    </p>

    <PromptMobileSheets
      :model-open="modelMenuOpen && isMobileSheet"
      :tool-open="toolMenuOpen && isMobileSheet"
      :attach-open="attachMenuOpen && isMobileSheet"
      :models="currentModels"
      :tools="tools"
      :model-value="modelValue"
      :show-camera-menu="showCameraMenu"
      :model-title="t('chat.modelSelect')"
      :attach-title="t('chat.attach')"
      @close-model="modelMenuOpen = false"
      @close-tool="toolMenuOpen = false"
      @close-attach="attachMenuOpen = false"
      @select-model="selectModel"
      @apply-tool="applyTool"
      @open-file-picker="openFilePicker"
    />
  </footer>
</template>

<script setup>
import {computed, nextTick, onBeforeUnmount, onMounted, ref} from 'vue';
import {useI18n} from 'vue-i18n';
import {usePlatformStore} from '@/stores/platformStore';
import {openNativeFilePicker} from '@/services/platformBridge';
import {
  createBrowserAttachment,
  createNativeAttachment,
  hydrateImageAttachment,
  revokeAttachmentUrl,
} from '@/utils/attachment';
import {useOutsideClick} from '@/composables/useOutsideClick';
import PromptActionToolbar from '@/components/prompt/parts/PromptActionToolbar.vue';
import PromptAttachmentPreviewList from '@/components/prompt/parts/PromptAttachmentPreviewList.vue';
import PromptMobileSheets from '@/components/prompt/parts/PromptMobileSheets.vue';
import PromptTextarea from '@/components/prompt/parts/PromptTextarea.vue';

const {t} = useI18n();

const props = defineProps({
  disabled: {type: Boolean, default: false},
  floating: {type: Boolean, default: false},
  showHelp: {type: Boolean, default: true},
  placeholder: {type: String, default: ''},
  modelValue: {type: String, default: 'gpt-5-thinking'},
  models: {type: Array, default: () => []},
  modelReadonly: {type: Boolean, default: false},
});

const emit = defineEmits([
  'submit',
  'focus',
  'blur',
  'height-change',
  'update:modelValue',
]);

const platformStore = usePlatformStore();
const text = ref('');
const textareaComponentRef = ref(null);
const toolbarRef = ref(null);
const fileInputRef = ref(null);
const attachments = ref([]);
const attachMenuOpen = ref(false);
const modelMenuOpen = ref(false);
const toolMenuOpen = ref(false);
const fileAccept = ref('');
const captureMode = ref(null);
const isMobileSheet = ref(false);
let lastHeight = 0;
let removeViewportListener = null;

const fallbackModels = [
  {id: props.modelValue, label: '빠른 모델', description: '현재 선택된 모델'},
];
const currentModels = computed(() =>
  props.models.length ? props.models : fallbackModels
);
const currentModel = computed(
  () =>
    currentModels.value.find((model) => model.id === props.modelValue) ||
    currentModels.value[0]
);
const tools = computed(() => [
  {
    id: 'image',
    icon: '▧',
    label: t('chat.suggestions.image'),
    prompt: '이미지 생성 프롬프트를 만들어줘',
  },
  {
    id: 'write',
    icon: '✎',
    label: t('chat.suggestions.writing'),
    prompt: '아래 내용을 더 자연스럽게 다듬어줘',
  },
  {
    id: 'find',
    icon: '◎',
    label: t('chat.suggestions.search'),
    prompt: '프로젝트에서 빠진 항목을 찾아줘',
  },
]);
const canSubmit = computed(
  () => text.value.trim().length > 0 || attachments.value.length > 0
);
const showCameraMenu = computed(() => platformStore.info.isAndroidApp);
const textareaRef = computed(() => textareaComponentRef.value?.textareaRef || null);

/**
 * Synchronizes mobile sheet mode from viewport width and app container class.
 * @returns {void}
 */
function syncViewportMode() {
  isMobileSheet.value = Boolean(
    window.matchMedia?.('(max-width: 900px)')?.matches ||
      document.querySelector('.app-container--mobile')
  );
}

/**
 * Recalculates textarea height and notifies the parent when composer height changes.
 * @returns {void}
 */
function resize() {
  const el = textareaRef.value;
  if (!el) return;
  el.style.height = 'auto';
  const maxHeight = window.matchMedia?.('(max-width: 900px)')?.matches
    ? 136
    : 160;
  const nextHeight = Math.min(Math.max(el.scrollHeight, 38), maxHeight);
  el.style.height = `${nextHeight}px`;
  el.style.overflowY = el.scrollHeight > maxHeight ? 'auto' : 'hidden';
  if (nextHeight !== lastHeight) {
    lastHeight = nextHeight;
    emit('height-change', nextHeight);
  }
}

/**
 * Emits focus and schedules textarea autosize after the browser finishes focus layout.
 * @returns {void}
 */
function handleFocus() {
  emit('focus');
  nextTick(resize);
}

/**
 * Submits text and attachment payload to the chat container.
 * @returns {void}
 */
function submit() {
  const value = text.value.trim();
  if ((!value && attachments.value.length === 0) || props.disabled) return;
  emit('submit', {text: value, attachments: attachments.value});
  text.value = '';
  attachments.value = [];
  closeMenus();
  nextTick(resize);
}

/**
 * Closes composer popovers except the surface explicitly kept open.
 * @param {'model'|'tool'|'attach'|''} except Menu id to keep open.
 * @returns {void}
 */
function closeMenus(except = '') {
  if (except !== 'model') modelMenuOpen.value = false;
  if (except !== 'tool') toolMenuOpen.value = false;
  if (except !== 'attach') attachMenuOpen.value = false;
}

/** @returns {void} */
function openModelSelector() {
  if (props.disabled || props.modelReadonly) return;
  syncViewportMode();
  const next = !modelMenuOpen.value;
  closeMenus('model');
  modelMenuOpen.value = next;
}

/** @returns {void} */
function openToolSelector() {
  if (props.disabled) return;
  syncViewportMode();
  const next = !toolMenuOpen.value;
  closeMenus('tool');
  toolMenuOpen.value = next;
}

/** @returns {void} */
function openAttachSelector() {
  if (props.disabled) return;
  syncViewportMode();
  const next = !attachMenuOpen.value;
  closeMenus('attach');
  attachMenuOpen.value = next;
}

/**
 * Selects the active model id and closes the model picker.
 * @param {string} id Model id.
 * @returns {void}
 */
function selectModel(id) {
  emit('update:modelValue', id);
  modelMenuOpen.value = false;
}

/**
 * Inserts tool prompt text into the textarea.
 * @param {{prompt: string}} tool Tool descriptor.
 * @returns {void}
 */
function applyTool(tool) {
  text.value = text.value ? `${text.value}\n${tool.prompt}` : tool.prompt;
  toolMenuOpen.value = false;
  nextTick(() => {
    textareaRef.value?.focus();
    resize();
  });
}

/**
 * Opens native Android picker when available, otherwise falls back to hidden file input.
 * @param {'camera'|'image'|'all'} type Picker source.
 * @returns {Promise<void>}
 */
async function openFilePicker(type) {
  if (props.disabled) return;
  attachMenuOpen.value = false;

  if (platformStore.info.isAndroidApp) {
    try {
      await openNativeFilePicker({
        source: type === 'camera' ? 'camera' : type === 'image' ? 'image' : 'all',
        multiple: type !== 'camera',
        accept: type === 'image' || type === 'camera' ? 'image/*' : '',
      });
      return;
    } catch (error) {
      console.warn('Android file picker failed. Falling back to web input.', error);
    }
  }

  const input = fileInputRef.value;
  if (!input) return;
  const isCamera = type === 'camera';
  const accept = type === 'image' || isCamera ? 'image/*' : '';
  const capture = isCamera ? 'environment' : null;
  fileAccept.value = accept;
  captureMode.value = capture;
  input.setAttribute('accept', accept);
  if (capture) input.setAttribute('capture', capture);
  else input.removeAttribute('capture');
  input.value = '';
  input.click();
}

/**
 * Adds files sent from the Android bridge.
 * @param {CustomEvent} event Native bridge event.
 * @returns {void}
 */
function handleNativeFileSelected(event) {
  const detail = event?.detail || {};
  if (detail.type !== 'ON_FILE_SELECTED') return;
  const nativeFiles = detail.payload?.files || [];
  const mapped = nativeFiles.map(createNativeAttachment);
  if (mapped.length) attachments.value = [...attachments.value, ...mapped];
}

/** @param {Event} event File input change event. @returns {void} */
function handleFileChange(event) {
  addFiles(event.target.files);
  event.target.value = '';
}

/** @param {ClipboardEvent} event Clipboard paste event. @returns {void} */
function handlePaste(event) {
  const files = Array.from(event.clipboardData?.files || []);
  if (!files.length) return;
  addFiles(files);
}

/**
 * Converts selected browser files into attachment view models.
 * @param {FileList|File[]} fileList Selected files.
 * @returns {void}
 */
function addFiles(fileList) {
  const mapped = Array.from(fileList || []).map(createBrowserAttachment);
  if (!mapped.length) return;

  attachments.value = [...attachments.value, ...mapped];
  mapped
    .filter((file) => file.kind === 'image')
    .forEach((attachment) => {
      hydrateImageAttachment(attachment, (dataUrl) => {
        const target = attachments.value.find((file) => file.id === attachment.id);
        if (!target) return;
        target.dataUrl = dataUrl;
        target.previewUrl = dataUrl;
        target.previewError = false;
      });
    });

  nextTick(() => {
    resize();
    emit('height-change', lastHeight);
  });
}

/** @param {object} file Failed attachment. @returns {void} */
function markPreviewError(file) {
  if (file) file.previewError = true;
}

/** @param {object} file Image attachment. @returns {void} */
function previewImage(file) {
  if (!file) return;
  const previewUrl = file.dataUrl || file.previewUrl || file.url || '';
  window.dispatchEvent(
    new CustomEvent('chat:image-preview', {
      detail: {...file, url: file.url || previewUrl, previewUrl},
    })
  );
}

/** @param {string} id Attachment id. @returns {void} */
function removeAttachment(id) {
  const target = attachments.value.find((file) => file.id === id);
  revokeAttachmentUrl(target);
  attachments.value = attachments.value.filter((file) => file.id !== id);
  nextTick(resize);
}


useOutsideClick(
  [
    () => toolbarRef.value?.modelRoot?.value,
    () => toolbarRef.value?.toolRoot?.value,
    () => toolbarRef.value?.attachRoot?.value,
  ],
  closeMenus,
  {shouldIgnore: () => isMobileSheet.value}
);

onMounted(() => {
  syncViewportMode();
  window.addEventListener('android-to-js', handleNativeFileSelected);
  resize();
  window.addEventListener('resize', syncViewportMode, {passive: true});
  removeViewportListener = () =>
    window.removeEventListener('resize', syncViewportMode);
});

onBeforeUnmount(() => {
  window.removeEventListener('android-to-js', handleNativeFileSelected);
  removeViewportListener?.();
  attachments.value.forEach((file) => {
    revokeAttachmentUrl(file);
  });
});
</script>
