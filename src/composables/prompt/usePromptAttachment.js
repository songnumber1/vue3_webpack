import {computed, nextTick, onBeforeUnmount, ref} from "vue";
import {useEventListener} from "@vueuse/core";
import {usePlatformStore} from "@/stores/platformStore";
import {openNativeFilePicker} from "@/platform/bridge/platformBridge";
import {
  createBrowserAttachment,
  createNativeAttachment,
  hydrateImageAttachment,
  revokeAttachmentUrl,
} from "@/utils/attachment";
import {logWarn} from "@/utils/logger";
import {
  ANDROID_TO_JS_EVENT,
  ATTACH_MENU_OPTIONS,
  FILE_PICKER_TYPE,
  IMAGE_PREVIEW_EVENT,
  NATIVE_FILE_SELECTED_TYPE,
  PROMPT_MENU_TYPE,
} from "@/constants/promptComposer";
import {useI18n} from "vue-i18n";

/**
 * @description 첨부 파일 목록 관리, 파일 피커, 네이티브 파일 선택, 이미지 프리뷰를 처리합니다.
 * @param {object} options - attachMenuOpen ref, resize 함수, getLastHeight 함수, emit 함수, disabled props ref
 * @returns {object} attachments 상태 및 첨부 관련 핸들러
 */
export function usePromptAttachment({
  attachMenuOpen,
  resize,
  getLastHeight,
  emit,
  disabled,
  toggleMenu,
}) {
  const {t} = useI18n();
  const platformStore = usePlatformStore();
  const fileInputRef = ref(null);
  const attachments = ref([]);
  const fileAccept = ref("");
  const captureMode = ref(null);

  const showCameraMenu = computed(() => platformStore.info.isAndroidApp);
  const attachOptions = computed(() =>
    ATTACH_MENU_OPTIONS.filter(
      (option) => !option.requiresCamera || showCameraMenu.value
    ).map((option) => ({
      ...option,
      label: t(option.labelKey),
    }))
  );

  function openAttachSelector() {
    if (disabled.value) return;

    toggleMenu(PROMPT_MENU_TYPE.attach);
  }

  async function openFilePicker(type = FILE_PICKER_TYPE.all) {
    if (disabled.value) return;
    attachMenuOpen.value = false;

    const option =
      ATTACH_MENU_OPTIONS.find((item) => item.id === type) ||
      ATTACH_MENU_OPTIONS.find((item) => item.id === FILE_PICKER_TYPE.all);

    if (platformStore.info.isAndroidApp) {
      try {
        await openNativeFilePicker({
          source: option.nativeSource,
          multiple: option.multiple,
          accept: option.accept,
        });
        return;
      } catch (error) {
        logWarn(
          "Android file picker failed. Falling back to web input.",
          error
        );
      }
    }

    const input = fileInputRef.value;
    if (!input) return;

    fileAccept.value = option.accept;
    captureMode.value = option.capture;
    input.setAttribute("accept", option.accept);
    if (option.capture) input.setAttribute("capture", option.capture);
    else input.removeAttribute("capture");
    input.value = "";
    input.click();
  }

  function handleNativeFileSelected(event) {
    const detail = event?.detail || {};
    if (detail.type !== NATIVE_FILE_SELECTED_TYPE) return;
    const nativeFiles = detail.payload?.files || [];
    const mapped = nativeFiles.map(createNativeAttachment);
    if (mapped.length) attachments.value = [...attachments.value, ...mapped];
  }

  function handleFileChange(event) {
    addFiles(event.target.files);
    event.target.value = "";
  }

  function addFiles(fileList) {
    const mapped = Array.from(fileList || []).map(createBrowserAttachment);
    if (!mapped.length) return;

    attachments.value = [...attachments.value, ...mapped];
    mapped
      .filter((file) => file.kind === "image")
      .forEach((attachment) => {
        hydrateImageAttachment(attachment, (dataUrl) => {
          const target = attachments.value.find(
            (file) => file.id === attachment.id
          );
          if (!target) return;
          target.dataUrl = dataUrl;
          target.previewUrl = dataUrl;
          target.previewError = false;
        });
      });

    nextTick(() => {
      resize();
      emit("height-change", getLastHeight());
    });
  }

  function markPreviewError(file) {
    if (file) file.previewError = true;
  }

  function previewImage(file) {
    if (!file) return;
    const previewUrl = file.dataUrl || file.previewUrl || file.url || "";
    window.dispatchEvent(
      new CustomEvent(IMAGE_PREVIEW_EVENT, {
        detail: {...file, url: file.url || previewUrl, previewUrl},
      })
    );
  }

  function removeAttachment(id) {
    const target = attachments.value.find((file) => file.id === id);
    revokeAttachmentUrl(target);
    attachments.value = attachments.value.filter((file) => file.id !== id);
    nextTick(resize);
  }

  function clearAttachments() {
    attachments.value.forEach((file) => {
      revokeAttachmentUrl(file);
    });
    attachments.value = [];
  }

  useEventListener(window, ANDROID_TO_JS_EVENT, handleNativeFileSelected);

  onBeforeUnmount(() => {
    attachments.value.forEach((file) => {
      revokeAttachmentUrl(file);
    });
  });

  return {
    fileInputRef,
    attachments,
    fileAccept,
    captureMode,
    attachOptions,
    openAttachSelector,
    openFilePicker,
    handleFileChange,
    addFiles,
    markPreviewError,
    previewImage,
    removeAttachment,
    clearAttachments,
  };
}
