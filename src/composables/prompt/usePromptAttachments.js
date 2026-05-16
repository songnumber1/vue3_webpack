/**
 * @file usePromptAttachments.js
 * @description Attachment selection, paste, preview and cleanup behavior for PromptComposer.
 */

import {nextTick, onBeforeUnmount, onMounted, ref} from 'vue';
import {
  createBrowserAttachment,
  createNativeAttachment,
  hydrateImageAttachment,
  revokeAttachmentUrl,
} from '@/utils/attachment';

/**
 * @param {{resize: Function, getLastHeight: Function}} textarea Textarea controller.
 * @param {Function} emit Prompt emit function.
 * @returns {object} Attachment controller.
 */
export function usePromptAttachments(textarea, emit) {
  const attachments = ref([]);

  /** @param {FileList|File[]} fileList Browser files. @returns {void} */
  function addFiles(fileList) {
    const mapped = Array.from(fileList || []).map(createBrowserAttachment);
    if (!mapped.length) return;

    attachments.value = [...attachments.value, ...mapped];
    mapped
      .filter((file) => file.kind === 'image')
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
      textarea.resize();
      emit('height-change', textarea.getLastHeight());
    });
  }

  /** @param {Event} event Input change event. @returns {void} */
  function handleFileChange(event) {
    addFiles(event.target.files);
    event.target.value = '';
  }

  /** @param {ClipboardEvent} event Paste event. @returns {void} */
  function handlePaste(event) {
    const files = Array.from(event.clipboardData?.files || []);
    if (!files.length) return;
    addFiles(files);
  }

  /** @param {CustomEvent} event Native bridge file event. @returns {void} */
  function handleNativeFileSelected(event) {
    const detail = event?.detail || {};
    if (detail.type !== 'ON_FILE_SELECTED') return;
    const nativeFiles = detail.payload?.files || [];
    const mapped = nativeFiles.map(createNativeAttachment);
    if (mapped.length) attachments.value = [...attachments.value, ...mapped];
  }

  /** @param {object} file Attachment. @returns {void} */
  function markPreviewError(file) {
    if (file) file.previewError = true;
  }

  /** @param {object} file Attachment. @returns {void} */
  function previewImage(file) {
    if (!file) return;
    const previewUrl = file.dataUrl || file.previewUrl || file.url || '';
    emit('image-preview', {...file, url: file.url || previewUrl, previewUrl});
  }

  /** @param {string} id Attachment id. @returns {void} */
  function removeAttachment(id) {
    const target = attachments.value.find((file) => file.id === id);
    revokeAttachmentUrl(target);
    attachments.value = attachments.value.filter((file) => file.id !== id);
    nextTick(textarea.resize);
  }

  /** @returns {void} */
  function clearAttachments() {
    attachments.value.forEach((file) => revokeAttachmentUrl(file));
    attachments.value = [];
  }

  onMounted(() => {
    window.addEventListener('android-to-js', handleNativeFileSelected);
  });

  onBeforeUnmount(() => {
    window.removeEventListener('android-to-js', handleNativeFileSelected);
    clearAttachments();
  });

  return {
    attachments,
    addFiles,
    handleFileChange,
    handlePaste,
    markPreviewError,
    previewImage,
    removeAttachment,
    clearAttachments,
  };
}
