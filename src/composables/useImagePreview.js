import {ref} from "vue";
import {useEventListener} from "@vueuse/core";
import {IMAGE_PREVIEW_EVENT} from "@/constants/promptComposer";

// 모듈 의존성을 모두 불러온 뒤, 아래에서 화면 상태와 실행 로직을 구성합니다.
/**
 * @description getPreviewSources 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {*} detail - detail 입력값입니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
function getPreviewSources(detail = {}) {
  // 계산된 결과를 호출부로 반환합니다.
  return [detail.dataUrl, detail.previewUrl, detail.url]
    .filter((url) => typeof url === "string" && url.length > 0)
    .filter((url, index, array) => array.indexOf(url) === index);
}

/**
 * @description readPreviewDataUrl 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {*} file - file 입력값입니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
function readPreviewDataUrl(file) {
  // 계산된 결과를 호출부로 반환합니다.
  return new Promise((resolve) => {
    // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
    if (!file || typeof FileReader === "undefined") return resolve("");
    const reader = new FileReader();
    reader.onload = () =>
      resolve(typeof reader.result === "string" ? reader.result : "");
    reader.onerror = () => resolve("");
    reader.readAsDataURL(file);
  });
}

/**
 * @description useImagePreview 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {void} voidParam - 별도 입력값 없이 실행됩니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
export function useImagePreview() {
  const previewImage = ref(null);

  /**
   * @description hydrateOpenPreviewFromFile 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
   * @param {*} targetPreview - targetPreview 입력값입니다.
   * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
   */
  async function hydrateOpenPreviewFromFile(targetPreview) {
    const dataUrl = await readPreviewDataUrl(targetPreview?.file);
    // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
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
   * @description openImagePreview 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
   * @param {*} event - event 입력값입니다.
   * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
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
    // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
    if (detail.file && !detail.dataUrl)
      hydrateOpenPreviewFromFile({...detail, id: previewImage.value.id});
  }

  /**
   * @description handlePreviewLoad 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
   * @param {void} voidParam - 별도 입력값 없이 실행됩니다.
   * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
   */
  function handlePreviewLoad() {
    // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
    if (!previewImage.value) return;
    previewImage.value.loading = false;
    previewImage.value.error = false;
  }

  /**
   * @description handlePreviewError 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
   * @param {void} voidParam - 별도 입력값 없이 실행됩니다.
   * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
   */
  async function handlePreviewError() {
    const current = previewImage.value;
    // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
    if (!current) return;
    const nextIndex = Number(current.sourceIndex || 0) + 1;
    const nextUrl = current.sources?.[nextIndex];
    // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
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
    // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
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
    // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
    if (previewImage.value?.id === current.id) {
      previewImage.value.loading = false;
      previewImage.value.error = true;
    }
  }

  /**
   * @description closeImagePreview 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
   * @param {void} voidParam - 별도 입력값 없이 실행됩니다.
   * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
   */
  function closeImagePreview() {
    previewImage.value = null;
  }

  useEventListener(window, IMAGE_PREVIEW_EVENT, openImagePreview);

  // 계산된 결과를 호출부로 반환합니다.
  return {
    previewImage,
    closeImagePreview,
    handlePreviewLoad,
    handlePreviewError,
  };
}
