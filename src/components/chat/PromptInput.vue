/** * @file PromptInput.vue * @description Vue component used in the chat web
application runtime. * @author OpenAI */

<template>
  <footer class="prompt-wrap" :class="{'prompt-wrap--floating': floating}">
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
          :class="{'attachment-preview-card--image': file.kind === 'image'}"
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
        :placeholder="placeholder"
        rows="1"
        @focus="handleFocus"
        @blur="emit('blur')"
        @input="resize"
        @keydown.enter.exact.prevent="submit"
        @paste="handlePaste"
      />

      <div class="prompt-action-row">
        <div class="prompt-left-actions">
          <div class="prompt-selector-wrap" ref="modelSelectorRef">
            <button
              class="prompt-model-trigger"
              type="button"
              :disabled="disabled"
              aria-label="모델 선택"
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
                :class="{active: model.id === modelValue}"
                type="button"
                @click="selectModel(model.id)"
              >
                <strong>{{ model.label }}</strong>
                <small>{{ model.description }}</small>
              </button>
            </div>
          </div>

          <div class="prompt-selector-wrap" ref="plusSelectorRef">
            <button
              class="prompt-icon-action"
              :class="{'prompt-icon-action--active': toolMenuOpen}"
              type="button"
              :disabled="disabled"
              aria-label="도구"
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
            class="prompt-selector-wrap attach-menu-wrap"
            ref="attachButtonRef"
          >
            <button
              class="prompt-icon-action attach-button"
              :class="{'prompt-icon-action--active': attachMenuOpen}"
              type="button"
              title="첨부"
              aria-label="첨부"
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
                <p>카메라로 촬영</p>
              </button>
              <button
                type="button"
                role="menuitem"
                @click="openFilePicker('image')"
              >
                <span aria-hidden="true">🖼️</span>
                <p>이미지 추가</p>
              </button>
              <button
                type="button"
                role="menuitem"
                @click="openFilePicker('all')"
              >
                <span aria-hidden="true">📎</span>
                <p>파일 추가</p>
              </button>
            </div>
          </div>
        </div>

        <button
          class="send-button"
          type="submit"
          :disabled="disabled || !canSubmit"
          title="전송"
          aria-label="전송"
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
      API 없이 동작하는 UI 데모입니다. 실제 연동은 resolver/api.js에서
      확장하세요.
    </p>

    <BaseBottomSheet
      :open="modelMenuOpen && isMobileSheet"
      title="모델 선택"
      @close="modelMenuOpen = false"
    >
      <button
        v-for="model in models"
        :key="model.id"
        class="bottom-sheet-option"
        :class="{active: model.id === modelValue}"
        type="button"
        @click="selectModel(model.id)"
      >
        <strong>{{ model.label }}</strong>
        <small>{{ model.description }}</small>
      </button>
    </BaseBottomSheet>

    <BaseBottomSheet
      :open="toolMenuOpen && isMobileSheet"
      title="도구"
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
      title="첨부"
      @close="attachMenuOpen = false"
    >
      <button
        v-if="showCameraMenu"
        class="bottom-sheet-option bottom-sheet-option--row"
        type="button"
        @click="openFilePicker('camera')"
      >
        <span aria-hidden="true">📷</span><strong>카메라로 촬영</strong>
      </button>
      <button
        class="bottom-sheet-option bottom-sheet-option--row"
        type="button"
        @click="openFilePicker('image')"
      >
        <span aria-hidden="true">🖼️</span><strong>이미지 추가</strong>
      </button>
      <button
        class="bottom-sheet-option bottom-sheet-option--row"
        type="button"
        @click="openFilePicker('all')"
      >
        <span aria-hidden="true">📎</span><strong>파일 추가</strong>
      </button>
    </BaseBottomSheet>
  </footer>
</template>

<script setup>
import {computed, nextTick, onBeforeUnmount, onMounted, ref} from "vue";
import {usePlatformStore} from "@/stores/platformStore";
import {openNativeFilePicker} from "@/services/platformBridge";
import {createId} from "@/utils/id";
import BaseBottomSheet from "./BaseBottomSheet.vue";

const props = defineProps({
  disabled: {type: Boolean, default: false},
  floating: {type: Boolean, default: false},
  showHelp: {type: Boolean, default: true},
  placeholder: {type: String, default: "Gemini에게 물어보기"},
  modelValue: {type: String, default: "gpt-5-thinking"},
  models: {type: Array, default: () => []},
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
  {id: props.modelValue, label: "빠른 모델", description: "현재 선택된 모델"},
];
const currentModels = computed(() =>
  props.models.length ? props.models : fallbackModels
);
const currentModel = computed(
  () =>
    currentModels.value.find((model) => model.id === props.modelValue) ||
    currentModels.value[0]
);
const tools = [
  {
    id: "image",
    icon: "▧",
    label: "이미지 만들기",
    prompt: "이미지 생성 프롬프트를 만들어줘",
  },
  {
    id: "write",
    icon: "✎",
    label: "글쓰기 또는 편집",
    prompt: "아래 내용을 더 자연스럽게 다듬어줘",
  },
  {
    id: "find",
    icon: "◎",
    label: "필요한 항목 찾기",
    prompt: "프로젝트에서 빠진 항목을 찾아줘",
  },
];

function getPreviewUrl(file) {
  return file?.dataUrl || file?.previewUrl || file?.url || "";
}

function markPreviewError(file) {
  if (!file) return;
  file.previewError = true;
}

const canSubmit = computed(
  () => text.value.trim().length > 0 || attachments.value.length > 0
);
const showCameraMenu = computed(() => platformStore.info.isAndroidApp);

function syncViewportMode() {
  isMobileSheet.value = Boolean(
    window.matchMedia?.("(max-width: 900px)")?.matches ||
    document.querySelector(".app-shell--mobile")
  );
}

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

function handleFocus() {
  emit("focus");
  nextTick(resize);
}

function submit() {
  const value = text.value.trim();
  if ((!value && attachments.value.length === 0) || props.disabled) return;
  emit("submit", {text: value, attachments: attachments.value});
  text.value = "";
  attachments.value = [];
  attachMenuOpen.value = false;
  modelMenuOpen.value = false;
  toolMenuOpen.value = false;
  nextTick(resize);
}

function closeMenus(except = "") {
  if (except !== "model") modelMenuOpen.value = false;
  if (except !== "tool") toolMenuOpen.value = false;
  if (except !== "attach") attachMenuOpen.value = false;
}

function openModelSelector() {
  if (props.disabled) return;
  syncViewportMode();
  const next = !modelMenuOpen.value;
  closeMenus("model");
  modelMenuOpen.value = next;
}

function openToolSelector() {
  if (props.disabled) return;
  syncViewportMode();
  const next = !toolMenuOpen.value;
  closeMenus("tool");
  toolMenuOpen.value = next;
}

function openAttachSelector() {
  if (props.disabled) return;
  syncViewportMode();
  const next = !attachMenuOpen.value;
  closeMenus("attach");
  attachMenuOpen.value = next;
}

function selectModel(id) {
  emit("update:modelValue", id);
  modelMenuOpen.value = false;
}

function applyTool(tool) {
  text.value = text.value ? `${text.value}\n${tool.prompt}` : tool.prompt;
  toolMenuOpen.value = false;
  nextTick(() => {
    textareaRef.value?.focus();
    resize();
  });
}

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
        error
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

function handleFileChange(event) {
  addFiles(event.target.files);
  event.target.value = "";
}

function handlePaste(event) {
  const files = Array.from(event.clipboardData?.files || []);
  if (!files.length) return;
  addFiles(files);
}

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

function isImageFile(file) {
  return Boolean(
    file?.type?.startsWith("image/") ||
    /\.(png|jpe?g|gif|webp|bmp|heic|heif)$/i.test(file?.name || "")
  );
}

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

function handleAttachmentPreview(file) {
  if (file?.kind !== "image") return;
  previewImage(file);
}

function removeAttachment(id) {
  const target = attachments.value.find((file) => file.id === id);
  if (target?.url) URL.revokeObjectURL(target.url);
  attachments.value = attachments.value.filter((file) => file.id !== id);
  nextTick(resize);
}

function previewImage(file) {
  if (!file) return;
  file.url = file.url || file.previewUrl || file.dataUrl || "";
  window.dispatchEvent(
    new CustomEvent("chat:image-preview", {
      detail: {...file, previewUrl: getPreviewUrl(file)},
    })
  );
}

function formatFileSize(size) {
  if (!size) return "0 B";
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / 1024 / 1024).toFixed(1)} MB`;
}

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
  window.addEventListener("resize", syncViewportMode, {passive: true});
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
