<!--
@file PromptInput.vue * @description Vue component used in the chat web
application runtime. * @author OpenAI
-->

<template>
  <footer class="prompt-wrap" :class="{ 'prompt-wrap--floating': floating }">
    <form class="prompt-box prompt-box--gemini" @submit.prevent="submit">
      <div
        v-if="attachments.length"
        class="attachment-preview-row"
        aria-label="첨부 파일 목록"
      >
        <div
          v-for="file in attachments"
          :key="file.id"
          class="attachment-preview-card"
          :class="{ 'attachment-preview-card--image': file.kind === 'image' }"
          :role="file.kind === 'image' ? 'button' : undefined"
          :tabindex="file.kind === 'image' ? 0 : undefined"
          :aria-label="
            file.kind === 'image' ? `${file.name} 미리보기` : undefined
          "
          @click="handleAttachmentPreview(file)"
          @keydown.enter.prevent="handleAttachmentPreview(file)"
          @keydown.space.prevent="handleAttachmentPreview(file)"
        >
          <div
            v-if="file.kind === 'image'"
            class="attachment-preview-thumb"
            aria-hidden="true"
          >
            <img
              :src="getPreviewUrl(file)"
              :alt="file.name"
              @error="markPreviewError(file)"
            />
          </div>
          <div v-else class="attachment-preview-file" aria-hidden="true">
            📄
          </div>
          <div class="attachment-preview-info">
            <strong :title="file.name">{{ file.name }}</strong>
            <span>{{ formatFileSize(file.size) }}</span>
          </div>
          <button
            type="button"
            class="attachment-preview-remove"
            :aria-label="`${file.name} 제거`"
            @pointerdown.stop
            @mousedown.stop
            @touchstart.stop
            @click.stop.prevent="removeAttachment(file.id)"
          >
            ×
          </button>
        </div>
      </div>

      <textarea
        ref="textareaRef"
        v-model="text"
        :disabled="disabled"
        :placeholder="placeholder || t('chat.promptPlaceholder')"
        rows="1"
        @focus="handleFocus"
        @blur="emit('blur')"
        @input="resize"
        @keydown.enter.exact.prevent="submit"
        @paste="handlePaste"
      />

      <div class="prompt-action-row">
        <div class="prompt-left-actions">
          <div ref="modelSelectorRef" class="prompt-selector-wrap">
            <button
              class="prompt-model-trigger"
              type="button"
              :disabled="disabled || modelReadonly"
              :title="modelReadonly ? '대화방 모델은 변경할 수 없습니다.' : undefined"
              :aria-label="t('chat.assistantSelect')"
              @click="openModelSelector"
            >
              <span>{{ currentModel.label }}</span>
              <svg viewBox="0 0 20 20" aria-hidden="true">
                <path
                  d="M5.5 7.5 10 12l4.5-4.5"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </button>
            <div
              v-if="modelMenuOpen && !isMobileSheet"
              class="prompt-popover model-menu prompt-model-menu"
            >
              <button
                v-for="model in models"
                :key="model.id"
                class="model-option"
                :class="{ active: model.id === modelValue }"
                type="button"
                @click="selectModel(model.id)"
              >
                <strong>{{ model.label }}</strong>
                <small>{{ model.description }}</small>
              </button>
            </div>
          </div>

          <div ref="plusSelectorRef" class="prompt-selector-wrap">
            <button
              class="prompt-icon-action"
              :class="{ 'prompt-icon-action--active': toolMenuOpen }"
              type="button"
              :disabled="disabled"
              aria-label="Tools"
              @click="openToolSelector"
            >
              ＋
            </button>
            <div
              v-if="toolMenuOpen && !isMobileSheet"
              class="prompt-popover prompt-tool-menu"
            >
              <button
                v-for="tool in tools"
                :key="tool.id"
                type="button"
                @click="applyTool(tool)"
              >
                <span aria-hidden="true">{{ tool.icon }}</span>
                <p>{{ tool.label }}</p>
              </button>
            </div>
          </div>

          <div
            ref="attachButtonRef"
            class="prompt-selector-wrap attach-menu-wrap"
          >
            <button
              class="prompt-icon-action attach-button"
              :class="{ 'prompt-icon-action--active': attachMenuOpen }"
              type="button"
              :title="t('chat.attach')"
              :aria-label="t('chat.attach')"
              :disabled="disabled"
              @click="openAttachSelector"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path
                  d="M21.4 11.6 12.1 20.9a6 6 0 0 1-8.5-8.5l9.6-9.6a4.1 4.1 0 0 1 5.8 5.8l-9.4 9.4a2.2 2.2 0 1 1-3.1-3.1l8.6-8.6"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </button>
            <div
              v-if="attachMenuOpen && !isMobileSheet"
              class="prompt-popover attach-menu"
              role="menu"
            >
              <button
                v-if="showCameraMenu"
                type="button"
                role="menuitem"
                @click="openFilePicker('camera')"
              >
                <span aria-hidden="true">📷</span>
                <p>Camera</p>
              </button>
              <button
                type="button"
                role="menuitem"
                @click="openFilePicker('image')"
              >
                <span aria-hidden="true">🖼️</span>
                <p>Image</p>
              </button>
              <button
                type="button"
                role="menuitem"
                @click="openFilePicker('all')"
              >
                <span aria-hidden="true">📎</span>
                <p>File</p>
              </button>
            </div>
          </div>
        </div>

        <button
          class="send-button"
          type="submit"
          :disabled="disabled || !canSubmit"
          :title="t('chat.send')"
          :aria-label="t('chat.send')"
        >
          ↗
        </button>
      </div>

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

    <BaseBottomSheet
      :open="modelMenuOpen && isMobileSheet"
      :title="t('chat.assistantSelect')"
      @close="modelMenuOpen = false"
    >
      <button
        v-for="model in models"
        :key="model.id"
        class="bottom-sheet-option"
        :class="{ active: model.id === modelValue }"
        type="button"
        @click="selectModel(model.id)"
      >
        <strong>{{ model.label }}</strong>
        <small>{{ model.description }}</small>
      </button>
    </BaseBottomSheet>

    <BaseBottomSheet
      :open="toolMenuOpen && isMobileSheet"
      title="Tools"
      @close="toolMenuOpen = false"
    >
      <button
        v-for="tool in tools"
        :key="tool.id"
        class="bottom-sheet-option bottom-sheet-option--row"
        type="button"
        @click="applyTool(tool)"
      >
        <span aria-hidden="true">{{ tool.icon }}</span>
        <strong>{{ tool.label }}</strong>
      </button>
    </BaseBottomSheet>

    <BaseBottomSheet
      :open="attachMenuOpen && isMobileSheet"
      :title="t('chat.attach')"
      @close="attachMenuOpen = false"
    >
      <button
        v-if="showCameraMenu"
        class="bottom-sheet-option bottom-sheet-option--row"
        type="button"
        @click="openFilePicker('camera')"
      >
        <span aria-hidden="true">📷</span><strong>Camera</strong>
      </button>
      <button
        class="bottom-sheet-option bottom-sheet-option--row"
        type="button"
        @click="openFilePicker('image')"
      >
        <span aria-hidden="true">🖼️</span><strong>Image</strong>
      </button>
      <button
        class="bottom-sheet-option bottom-sheet-option--row"
        type="button"
        @click="openFilePicker('all')"
      >
        <span aria-hidden="true">📎</span><strong>File</strong>
      </button>
    </BaseBottomSheet>
  </footer>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import { usePlatformStore } from "@/stores/platformStore";
import { openNativeFilePicker } from "@/services/platformBridge";
import { createId } from "@/utils/id";
import BaseBottomSheet from "./BaseBottomSheet.vue";

const { t } = useI18n();

const props = defineProps({
  disabled: { type: Boolean, default: false },
  floating: { type: Boolean, default: false },
  showHelp: { type: Boolean, default: true },
  placeholder: { type: String, default: "" },
  modelValue: { type: String, default: "gpt-5-thinking" },
  models: { type: Array, default: () => [] },
  modelReadonly: { type: Boolean, default: false },
});

const emit = defineEmits([
  "submit",
  "focus",
  "blur",
  "height-change",
  "update:modelValue",
]);
const platformStore = usePlatformStore();
const text = ref("");
const textareaRef = ref(null);
const fileInputRef = ref(null);
const attachButtonRef = ref(null);
const modelSelectorRef = ref(null);
const plusSelectorRef = ref(null);
const attachments = ref([]);
const attachMenuOpen = ref(false);
const modelMenuOpen = ref(false);
const toolMenuOpen = ref(false);
const fileAccept = ref("");
const captureMode = ref(null);
const isMobileSheet = ref(false);
let lastHeight = 0;
let removeViewportListener = null;

const fallbackModels = [
  { id: props.modelValue, label: "빠른 모델", description: "현재 선택된 모델" },
];
const currentModels = computed(() =>
  props.models.length ? props.models : fallbackModels,
);
const currentModel = computed(
  () =>
    currentModels.value.find((model) => model.id === props.modelValue) ||
    currentModels.value[0],
);
const tools = computed(() => [
  {
    id: "image",
    icon: "▧",
    label: t("chat.suggestions.image"),
    prompt: "이미지 생성 프롬프트를 만들어줘",
  },
  {
    id: "write",
    icon: "✎",
    label: t("chat.suggestions.writing"),
    prompt: "아래 내용을 더 자연스럽게 다듬어줘",
  },
  {
    id: "find",
    icon: "◎",
    label: t("chat.suggestions.search"),
    prompt: "프로젝트에서 빠진 항목을 찾아줘",
  },
]);

/**
 * getPreviewUrl 처리 함수입니다.
 * @param {*} file 함수 실행에 필요한 입력값입니다.
 * @returns {*} 처리 결과를 반환합니다.
 */
function getPreviewUrl(file) {
  return file?.dataUrl || file?.previewUrl || file?.url || "";
}

/**
 * markPreviewError 처리 함수입니다.
 * @param {*} file 함수 실행에 필요한 입력값입니다.
 * @returns {void}
 */
function markPreviewError(file) {
  if (!file) return;
  file.previewError = true;
}

const canSubmit = computed(
  () => text.value.trim().length > 0 || attachments.value.length > 0,
);
const showCameraMenu = computed(() => platformStore.info.isAndroidApp);

/**
 * syncViewportMode 처리 함수입니다.
 * @returns {void}
 */
function syncViewportMode() {
  isMobileSheet.value = Boolean(
    window.matchMedia?.("(max-width: 900px)")?.matches ||
    document.querySelector(".app-container--mobile, .app-shell--mobile"),
  );
}

/**
 * resize 처리 함수입니다.
 * @returns {void}
 */
function resize() {
  const el = textareaRef.value;
  if (!el) return;
  el.style.height = "auto";
  const maxHeight = window.matchMedia?.("(max-width: 900px)")?.matches
    ? 136
    : 160;
  const nextHeight = Math.min(Math.max(el.scrollHeight, 38), maxHeight);
  el.style.height = `${nextHeight}px`;
  el.style.overflowY = el.scrollHeight > maxHeight ? "auto" : "hidden";
  if (nextHeight !== lastHeight) {
    lastHeight = nextHeight;
    emit("height-change", nextHeight);
  }
}

/**
 * handleFocus 처리 함수입니다.
 * @returns {void}
 */
function handleFocus() {
  emit("focus");
  nextTick(resize);
}

/**
 * submit 처리 함수입니다.
 * @returns {void}
 */
function submit() {
  const value = text.value.trim();
  if ((!value && attachments.value.length === 0) || props.disabled) return;
  emit("submit", { text: value, attachments: attachments.value });
  text.value = "";
  attachments.value = [];
  attachMenuOpen.value = false;
  modelMenuOpen.value = false;
  toolMenuOpen.value = false;
  nextTick(resize);
}

/**
 * closeMenus 처리 함수입니다.
 * @param {*} except 함수 실행에 필요한 입력값입니다.
 * @returns {void}
 */
function closeMenus(except = "") {
  if (except !== "model") modelMenuOpen.value = false;
  if (except !== "tool") toolMenuOpen.value = false;
  if (except !== "attach") attachMenuOpen.value = false;
}

/**
 * openModelSelector 처리 함수입니다.
 * @returns {void}
 */
function openModelSelector() {
  if (props.disabled || props.modelReadonly) return;
  syncViewportMode();
  const next = !modelMenuOpen.value;
  closeMenus("model");
  modelMenuOpen.value = next;
}

/**
 * openToolSelector 처리 함수입니다.
 * @returns {void}
 */
function openToolSelector() {
  if (props.disabled) return;
  syncViewportMode();
  const next = !toolMenuOpen.value;
  closeMenus("tool");
  toolMenuOpen.value = next;
}

/**
 * openAttachSelector 처리 함수입니다.
 * @returns {void}
 */
function openAttachSelector() {
  if (props.disabled) return;
  syncViewportMode();
  const next = !attachMenuOpen.value;
  closeMenus("attach");
  attachMenuOpen.value = next;
}

/**
 * selectModel 처리 함수입니다.
 * @param {*} id 함수 실행에 필요한 입력값입니다.
 * @returns {void}
 */
function selectModel(id) {
  emit("update:modelValue", id);
  modelMenuOpen.value = false;
}

/**
 * applyTool 처리 함수입니다.
 * @param {*} tool 함수 실행에 필요한 입력값입니다.
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
 * openFilePicker 처리 함수입니다.
 * @param {*} type 함수 실행에 필요한 입력값입니다.
 * @returns {Promise<*>} 비동기 처리 결과를 반환합니다.
 */
async function openFilePicker(type) {
  if (props.disabled) return;
  attachMenuOpen.value = false;

  if (platformStore.info.isAndroidApp) {
    try {
      await openNativeFilePicker({
        source:
          type === "camera" ? "camera" : type === "image" ? "image" : "all",
        multiple: type !== "camera",
        accept: type === "image" || type === "camera" ? "image/*" : "",
      });
      return;
    } catch (error) {
      console.warn(
        "Android file picker failed. Falling back to web input.",
        error,
      );
    }
  }

  const input = fileInputRef.value;
  if (!input) return;
  const isCamera = type === "camera";
  const accept = type === "image" || isCamera ? "image/*" : "";
  const capture = isCamera ? "environment" : null;
  fileAccept.value = accept;
  captureMode.value = capture;
  input.setAttribute("accept", accept);
  if (capture) input.setAttribute("capture", capture);
  else input.removeAttribute("capture");
  input.value = "";
  input.click();
}

/**
 * handleNativeFileSelected 처리 함수입니다.
 * @param {*} event 함수 실행에 필요한 입력값입니다.
 * @returns {void}
 */
function handleNativeFileSelected(event) {
  const detail = event?.detail || {};
  if (detail.type !== "ON_FILE_SELECTED") return;
  const nativeFiles = detail.payload?.files || [];
  const mapped = nativeFiles.map((file) => ({
    id: createId("attachment"),
    name: file.name || "네이티브 첨부 파일",
    size: file.size || 0,
    type: file.type || inferMimeType(file.name) || "application/octet-stream",
    kind: (file.type || "").startsWith("image/") ? "image" : "file",
    url: file.uri || "",
    previewUrl: file.uri || "",
    dataUrl: "",
    previewError: false,
    nativeFile: file,
  }));
  if (mapped.length) attachments.value = [...attachments.value, ...mapped];
}

/**
 * handleFileChange 처리 함수입니다.
 * @param {*} event 함수 실행에 필요한 입력값입니다.
 * @returns {void}
 */
function handleFileChange(event) {
  addFiles(event.target.files);
  event.target.value = "";
}

/**
 * handlePaste 처리 함수입니다.
 * @param {*} event 함수 실행에 필요한 입력값입니다.
 * @returns {void}
 */
function handlePaste(event) {
  const files = Array.from(event.clipboardData?.files || []);
  if (!files.length) return;
  addFiles(files);
}

/**
 * addFiles 처리 함수입니다.
 * @param {*} fileList 함수 실행에 필요한 입력값입니다.
 * @returns {void}
 */
function addFiles(fileList) {
  const nextFiles = Array.from(fileList || []);
  if (!nextFiles.length) return;
  const mapped = nextFiles.map((file) => {
    const isImage = isImageFile(file);
    const objectUrl = URL.createObjectURL(file);
    return {
      id: createId("attachment"),
      name: file.name || "첨부 파일",
      size: file.size || 0,
      type: file.type || inferMimeType(file.name) || "application/octet-stream",
      kind: isImage ? "image" : "file",
      url: objectUrl,
      previewUrl: objectUrl,
      dataUrl: "",
      previewError: false,
      file,
    };
  });
  attachments.value = [...attachments.value, ...mapped];
  mapped
    .filter((file) => file.kind === "image")
    .forEach((file) => hydrateImagePreviewUrl(file));
  nextTick(() => {
    resize();
    emit("height-change", lastHeight);
  });
}

/**
 * isImageFile 처리 함수입니다.
 * @param {*} file 함수 실행에 필요한 입력값입니다.
 * @returns {boolean|*} 처리 결과를 반환합니다.
 */
function isImageFile(file) {
  return Boolean(
    file?.type?.startsWith("image/") ||
    /\.(png|jpe?g|gif|webp|bmp|heic|heif)$/i.test(file?.name || ""),
  );
}

/**
 * inferMimeType 처리 함수입니다.
 * @param {*} name 함수 실행에 필요한 입력값입니다.
 * @returns {void}
 */
function inferMimeType(name = "") {
  const normalized = name.toLowerCase();
  if (/\.png$/.test(normalized)) return "image/png";
  if (/\.(jpg|jpeg)$/.test(normalized)) return "image/jpeg";
  if (/\.gif$/.test(normalized)) return "image/gif";
  if (/\.webp$/.test(normalized)) return "image/webp";
  if (/\.bmp$/.test(normalized)) return "image/bmp";
  if (/\.(heic|heif)$/.test(normalized)) return "image/heic";
  return "";
}

/**
 * hydrateImagePreviewUrl 처리 함수입니다.
 * @param {*} attachment 함수 실행에 필요한 입력값입니다.
 * @returns {void}
 */
function hydrateImagePreviewUrl(attachment) {
  const sourceFile = attachment?.file;
  if (!sourceFile || typeof FileReader === "undefined") return;
  const reader = new FileReader();
  reader.onload = () => {
    const dataUrl = typeof reader.result === "string" ? reader.result : "";
    if (!dataUrl) return;
    const target = attachments.value.find((file) => file.id === attachment.id);
    if (target) {
      target.dataUrl = dataUrl;
      target.previewUrl = dataUrl;
      target.previewError = false;
      attachment.dataUrl = dataUrl;
      attachment.previewUrl = dataUrl;
    }
  };
  reader.onerror = () => {
    attachment.previewError = true;
  };
  reader.readAsDataURL(sourceFile);
}

/**
 * handleAttachmentPreview 처리 함수입니다.
 * @param {*} file 함수 실행에 필요한 입력값입니다.
 * @returns {void}
 */
function handleAttachmentPreview(file) {
  if (file?.kind !== "image") return;
  previewImage(file);
}

/**
 * removeAttachment 처리 함수입니다.
 * @param {*} id 함수 실행에 필요한 입력값입니다.
 * @returns {void}
 */
function removeAttachment(id) {
  const target = attachments.value.find((file) => file.id === id);
  if (target?.url) URL.revokeObjectURL(target.url);
  attachments.value = attachments.value.filter((file) => file.id !== id);
  nextTick(resize);
}

/**
 * previewImage 처리 함수입니다.
 * @param {*} file 함수 실행에 필요한 입력값입니다.
 * @returns {void}
 */
function previewImage(file) {
  if (!file) return;
  file.url = file.url || file.previewUrl || file.dataUrl || "";
  window.dispatchEvent(
    new CustomEvent("chat:image-preview", {
      detail: { ...file, previewUrl: getPreviewUrl(file) },
    }),
  );
}

/**
 * formatFileSize 처리 함수입니다.
 * @param {*} size 함수 실행에 필요한 입력값입니다.
 * @returns {void}
 */
function formatFileSize(size) {
  if (!size) return "0 B";
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / 1024 / 1024).toFixed(1)} MB`;
}

/**
 * handleDocumentClick 처리 함수입니다.
 * @param {*} event 함수 실행에 필요한 입력값입니다.
 * @returns {void}
 */
function handleDocumentClick(event) {
  if (isMobileSheet.value) return;
  const roots = [
    attachButtonRef.value,
    modelSelectorRef.value,
    plusSelectorRef.value,
  ];
  if (roots.some((root) => root?.contains(event.target))) return;
  closeMenus();
}

onMounted(() => {
  syncViewportMode();
  window.addEventListener("android-to-js", handleNativeFileSelected);
  resize();
  document.addEventListener("click", handleDocumentClick);
  window.addEventListener("resize", syncViewportMode, { passive: true });
  removeViewportListener = () =>
    window.removeEventListener("resize", syncViewportMode);
});

onBeforeUnmount(() => {
  window.removeEventListener("android-to-js", handleNativeFileSelected);
  document.removeEventListener("click", handleDocumentClick);
  removeViewportListener?.();
  attachments.value.forEach((file) => {
    if (file.url) URL.revokeObjectURL(file.url);
  });
});
</script>
