import {ref} from "vue";
import {useEventListener} from "@vueuse/core";
import {IMAGE_PREVIEW_EVENT} from "@/constants/promptComposer";

function getPreviewSources(detail = {}) {
  return [detail.dataUrl, detail.previewUrl, detail.url]
    .filter((url) => typeof url === "string" && url.length > 0)
    .filter((url, index, array) => array.indexOf(url) === index);
}
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
export function useImagePreview() {
  const previewImage = ref(null);
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
  function handlePreviewLoad() {
    if (!previewImage.value) return;
    previewImage.value.loading = false;
    previewImage.value.error = false;
  }
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
  function closeImagePreview() {
    previewImage.value = null;
  }

  useEventListener(window, IMAGE_PREVIEW_EVENT, openImagePreview);

  return {
    previewImage,
    closeImagePreview,
    handlePreviewLoad,
    handlePreviewError,
  };
}
