<template>
  <footer class="prompt-wrap" :class="{'prompt-wrap--floating': floating}">
    <form class="prompt-box" @submit.prevent="submit">
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
          :aria-label="file.kind === 'image' ? `${file.name} 미리보기` : undefined"
          @click="handleAttachmentPreview(file)"
          @keydown.enter.prevent="handleAttachmentPreview(file)"
          @keydown.space.prevent="handleAttachmentPreview(file)"
        >
          <div
            v-if="file.kind === 'image'"
            class="attachment-preview-thumb"
            aria-hidden="true"
          >
            <img :src="getPreviewUrl(file)" :alt="file.name" @error="markPreviewError(file)" />
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

      <div class="prompt-input-row">
        <div class="attach-menu-wrap">
          <button
            ref="attachButtonRef"
            class="attach-button"
            :class="{'attach-button--active': attachMenuOpen}"
            type="button"
            title="첨부"
            aria-label="첨부"
            :aria-expanded="attachMenuOpen"
            :disabled="disabled"
            @click="toggleAttachMenu"
          >
            ＋
          </button>

          <div v-if="attachMenuOpen" class="attach-menu" role="menu">
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
  </footer>
</template>

<script setup>
import {computed, nextTick, onBeforeUnmount, onMounted, ref} from "vue";
import {isAndroidApp} from "@/core/config";
import {useAppContext} from "@/composables/useAppContext";
import {createId} from "@/utils/id";

const props = defineProps({
  disabled: {type: Boolean, default: false},
  floating: {type: Boolean, default: false},
  showHelp: {type: Boolean, default: true},
  placeholder: {type: String, default: "무엇이든 물어보세요"},
});

const emit = defineEmits(["submit", "focus", "blur", "height-change"]);
const {appInfo} = useAppContext();
const text = ref("");
const textareaRef = ref(null);
const fileInputRef = ref(null);
const attachButtonRef = ref(null);
const attachments = ref([]);
const attachMenuOpen = ref(false);
const fileAccept = ref("");
const captureMode = ref(null);
let lastHeight = 0;

function getPreviewUrl(file) {
  return file?.previewUrl || file?.dataUrl || file?.url || "";
}

function markPreviewError(file) {
  if (!file) return;
  file.previewError = true;
}

const canSubmit = computed(
  () => text.value.trim().length > 0 || attachments.value.length > 0
);

// 웹 브라우저는 카메라가 없다는 운영 정책을 반영하고,
// Android 앱 WebView에서만 카메라 촬영 메뉴를 노출한다.
const showCameraMenu = computed(() => isAndroidApp(appInfo));

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

  emit("submit", {
    text: value,
    // Android WebView에서는 FileReader가 완료되기 전에 전송하면
    // 얕은 복사본이 data URL 갱신을 받지 못해 큰 미리보기가 깨질 수 있다.
    // 메시지 영역에서도 같은 첨부 객체를 참조하게 하여 previewUrl 갱신이 유지되도록 한다.
    attachments: attachments.value,
  });

  text.value = "";
  // submit 이후 첨부 객체는 대화 메시지에서 계속 사용된다.
  // 여기서 blob URL을 revoke하면 Android WebView에서 이미지/파일 미리보기가
  // 늦게 로딩되는 순간 깨질 수 있으므로, 메시지 정리 시점(ChatShell)에서 회수한다.
  attachments.value = [];
  attachMenuOpen.value = false;
  nextTick(resize);
}

function toggleAttachMenu() {
  if (props.disabled) return;
  attachMenuOpen.value = !attachMenuOpen.value;
}

function openFilePicker(type) {
  if (props.disabled) return;

  const input = fileInputRef.value;
  if (!input) return;

  // Android WebView는 input.click()이 사용자 터치 이벤트 체인에서
  // 바로 실행되지 않으면 파일 선택창을 열지 않는 경우가 많다.
  // 그래서 nextTick/requestAnimationFrame/setTimeout을 거치지 않고
  // 메뉴 버튼 클릭 이벤트 안에서 즉시 네이티브 파일 선택 요청을 발생시킨다.
  attachMenuOpen.value = false;

  const isCamera = type === "camera";
  const accept = type === "image" || isCamera ? "image/*" : "";
  const capture = isCamera ? "environment" : null;

  fileAccept.value = accept;
  captureMode.value = capture;
  input.setAttribute("accept", accept);

  if (capture) {
    input.setAttribute("capture", capture);
  } else {
    input.removeAttribute("capture");
  }

  // 같은 파일을 다시 선택해도 change 이벤트가 발생하도록 초기화한다.
  input.value = "";
  input.click();
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

  // 일부 Android WebView에서는 blob URL 이미지가 전체 미리보기에서 늦게 깨지는 경우가 있어
  // 이미지 첨부만 data URL을 보조 previewUrl로 생성한다. 원본 파일/다운로드 URL은 유지한다.
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
  window.dispatchEvent(new CustomEvent("chat:image-preview", {detail: {...file, url: getPreviewUrl(file)}}));
}

function formatFileSize(size) {
  if (!size) return "0 B";
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / 1024 / 1024).toFixed(1)} MB`;
}

function handleDocumentClick(event) {
  if (!attachMenuOpen.value) return;
  const root = attachButtonRef.value?.closest(".attach-menu-wrap");
  if (root?.contains(event.target)) return;
  attachMenuOpen.value = false;
}

onMounted(() => {
  resize();
  document.addEventListener("click", handleDocumentClick);
});

onBeforeUnmount(() => {
  document.removeEventListener("click", handleDocumentClick);
  attachments.value.forEach((file) => {
    if (file.url) URL.revokeObjectURL(file.url);
  });
});
</script>
