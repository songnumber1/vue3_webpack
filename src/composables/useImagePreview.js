import {onBeforeUnmount, onMounted, ref} from "vue";

/**
 * Returns unique preview source URLs from an attachment detail object.
 * @param {{dataUrl?: string, previewUrl?: string, url?: string}} detail Attachment preview event detail
 * @returns {string[]} Unique source URLs ordered by priority
 */
/**
 * getPreviewSources 처리 함수입니다.
 * @param {*} detail 함수 실행에 필요한 입력값입니다.
 * @returns {*} 처리 결과를 반환합니다.
 */
function getPreviewSources(detail = {}) {
  return [detail.dataUrl, detail.previewUrl, detail.url]
    .filter((url) => typeof url === "string" && url.length > 0)
    .filter((url, index, array) => array.indexOf(url) === index);
}

/**
 * Reads a browser File as data URL for preview fallback.
 * @param {File|null|undefined} file Browser file object
 * @returns {Promise<string>} Data URL or empty string
 */
/**
 * readPreviewDataUrl 처리 함수입니다.
 * @param {*} file 함수 실행에 필요한 입력값입니다.
 * @returns {void}
 */
function readPreviewDataUrl(file) {
  return new Promise((resolve) => {
    if (!file || typeof FileReader === "undefined") return resolve("");
    const reader = new FileReader();
    reader.onload = () =>
      resolve(typeof reader.result === "string" ? reader.result : "");
    reader.onerror = () => resolve("");
    reader.readAsDataURL(file);
  });
}

/**
 * Manages the global chat:image-preview event and image fallback handling.
 * @returns {{previewImage: import('vue').Ref<Object|null>, closeImagePreview: Function, handlePreviewLoad: Function, handlePreviewError: Function}}
 */
export function useImagePreview() {
  const previewImage = ref(null);

  /**
   * hydrateOpenPreviewFromFile 처리 함수입니다.
   * @param {*} targetPreview 함수 실행에 필요한 입력값입니다.
   * @returns {Promise<*>} 비동기 처리 결과를 반환합니다.
   */
  async function hydrateOpenPreviewFromFile(targetPreview) {
    const dataUrl = await readPreviewDataUrl(targetPreview?.file);
    if (!dataUrl || previewImage.value?.id !== targetPreview.id) return;
    previewImage.value = {
      ...previewImage.value,
      dataUrl,
      url: dataUrl,
      sources: [dataUrl, ...(previewImage.value.sources || [])].filter(
        (url, index, array) => url && array.indexOf(url) === index
      ),
      loading: true,
      error: false,
    };
  }

  /**
   * openImagePreview 처리 함수입니다.
   * @param {*} event 함수 실행에 필요한 입력값입니다.
   * @returns {void}
   */
  function openImagePreview(event) {
    const detail = event?.detail || {};
    const sources = getPreviewSources(detail);
    const firstUrl = sources[0] || "";
    previewImage.value = {
      ...detail,
      url: firstUrl,
      sources,
      sourceIndex: 0,
      loading: Boolean(firstUrl || detail.file),
      error: !firstUrl && !detail.file,
    };
    if (detail.file && !detail.dataUrl)
      hydrateOpenPreviewFromFile({...detail, id: previewImage.value.id});
  }

  /**
   * handlePreviewLoad 처리 함수입니다.
   * @returns {void}
   */
  function handlePreviewLoad() {
    if (!previewImage.value) return;
    previewImage.value.loading = false;
    previewImage.value.error = false;
  }

  /**
   * handlePreviewError 처리 함수입니다.
   * @returns {Promise<*>} 비동기 처리 결과를 반환합니다.
   */
  async function handlePreviewError() {
    const current = previewImage.value;
    if (!current) return;
    const nextIndex = Number(current.sourceIndex || 0) + 1;
    const nextUrl = current.sources?.[nextIndex];
    if (nextUrl) {
      previewImage.value = {
        ...current,
        url: nextUrl,
        sourceIndex: nextIndex,
        loading: true,
        error: false,
      };
      return;
    }
    const dataUrl = await readPreviewDataUrl(current.file);
    if (dataUrl && previewImage.value?.id === current.id) {
      previewImage.value = {
        ...previewImage.value,
        dataUrl,
        url: dataUrl,
        sources: [dataUrl],
        sourceIndex: 0,
        loading: true,
        error: false,
      };
      return;
    }
    if (previewImage.value?.id === current.id) {
      previewImage.value.loading = false;
      previewImage.value.error = true;
    }
  }

  /**
   * closeImagePreview 처리 함수입니다.
   * @returns {void}
   */
  function closeImagePreview() {
    previewImage.value = null;
  }

  onMounted(() =>
    window.addEventListener("chat:image-preview", openImagePreview)
  );
  onBeforeUnmount(() =>
    window.removeEventListener("chat:image-preview", openImagePreview)
  );

  return {
    previewImage,
    closeImagePreview,
    handlePreviewLoad,
    handlePreviewError,
  };
}
