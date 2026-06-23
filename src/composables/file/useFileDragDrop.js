/**
 * @file composables/file/useFileDragDrop.js
 * @description 특정 DOM 영역에 파일 드래그앤드롭 이벤트를 연결하는 범용 composable입니다.
 *
 * 프리징 코드 주석 기준:
 * - 이 모듈은 파일 선택 로직을 직접 수행하지 않고, 드롭된 File 배열만 상위 콜백으로 전달합니다.
 * - 호출부는 기존 첨부 파이프라인(addFiles 등)을 onDropFiles로 연결해 UI/UX 회귀를 최소화하세요.
 */

import {computed, ref, unref, watch} from "vue";
import {useEventListener} from "@vueuse/core";

const FILE_DATA_TRANSFER_TYPE = "Files";

/**
 * Ref, computed, boolean, getter 함수 형태로 전달되는 옵션 값을 안전하게 현재 값으로 해석합니다.
 */
function resolveOptionValue(value) {
  return typeof value === "function" ? value() : unref(value);
}

/**
 * 브라우저 드래그 이벤트가 실제 파일 payload를 포함하는지 확인합니다.
 */
function hasFilePayload(event) {
  return Array.from(event?.dataTransfer?.types || []).includes(
    FILE_DATA_TRANSFER_TYPE
  );
}

/**
 * 파일 드롭 시 브라우저가 파일을 페이지로 열어버리는 기본 동작을 차단합니다.
 */
function preventFileDropDefault(event) {
  event.preventDefault();
  event.stopPropagation();
}

/**
 * 드래그가 브라우저 뷰포트 밖으로 빠져나간 케이스인지 판별합니다.
 * Chrome은 드롭존 밖으로 나갈 때 dragleave의 dataTransfer.types가 비어 있을 수 있어
 * 드래그 상태가 남는 현상을 이 보정으로 정리합니다.
 */
function isLeavingViewport(event) {
  const x = event.clientX;
  const y = event.clientY;
  const width = window.innerWidth || document.documentElement?.clientWidth || 0;
  const height =
    window.innerHeight || document.documentElement?.clientHeight || 0;

  return x <= 0 || y <= 0 || x >= width || y >= height;
}

/**
 * dragleave가 자식 요소 이동 때문에 발생한 것인지 판별합니다.
 */
function isMovingInsideCurrentTarget(event) {
  const currentTarget = event.currentTarget;
  const nextTarget = event.relatedTarget;

  if (!currentTarget || !nextTarget) return false;
  if (typeof currentTarget.contains !== "function") return false;

  return currentTarget.contains(nextTarget);
}

/**
 * @function useFileDragDrop
 * @description 지정한 targetRef를 파일 드롭존으로 만들고 드래그 상태를 외부로 제공합니다.
 * @param {Object} options - 드래그앤드롭 동작 옵션입니다.
 * @param {Ref<HTMLElement|null>} options.targetRef - 이벤트를 연결할 DOM ref입니다.
 * @param {boolean|Ref<boolean>|ComputedRef<boolean>|Function} [options.enabled=true] - 드롭 허용 여부입니다.
 * @param {Function} [options.onDropFiles] - 드롭 성공 시 File 배열을 전달받는 콜백입니다.
 * @param {Function} [options.onDropRejected] - 비활성 상태 드롭 등 거부 상황을 전달받는 콜백입니다.
 * @param {boolean|Ref<boolean>|ComputedRef<boolean>|Function} [options.preventOnDisabled=true] - 비활성 상태에서도 브라우저 기본 파일 열기를 막을지 여부입니다.
 */
export function useFileDragDrop({
  targetRef,
  enabled = true,
  onDropFiles,
  onDropRejected,
  preventOnDisabled = true,
} = {}) {
  const dragDepth = ref(0);
  const isFileDragging = ref(false);

  const isFileDropEnabled = computed(
    () => resolveOptionValue(enabled) === true
  );
  const shouldPreventOnDisabled = computed(
    () => resolveOptionValue(preventOnDisabled) !== false
  );
  const isFileDropDisabled = computed(() => !isFileDropEnabled.value);

  function resetFileDragState() {
    dragDepth.value = 0;
    isFileDragging.value = false;
  }

  function rejectDrop(event, reason) {
    resetFileDragState();

    if (typeof onDropRejected === "function") {
      onDropRejected({event, reason});
    }
  }

  function guardDisabledFileEvent(event, reason) {
    if (isFileDropEnabled.value) return false;
    if (!hasFilePayload(event)) return true;

    if (shouldPreventOnDisabled.value) {
      preventFileDropDefault(event);
    }

    if (reason === "drop") {
      rejectDrop(event, "disabled");
    } else {
      resetFileDragState();
    }

    return true;
  }

  function handleDragEnter(event) {
    if (guardDisabledFileEvent(event, "dragenter")) return;
    if (!hasFilePayload(event)) return;

    preventFileDropDefault(event);

    dragDepth.value = 1;
    isFileDragging.value = true;
  }

  function handleDragOver(event) {
    if (guardDisabledFileEvent(event, "dragover")) return;
    if (!hasFilePayload(event)) return;

    preventFileDropDefault(event);

    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = "copy";
    }

    isFileDragging.value = true;
  }

  function handleDragLeave(event) {
    if (guardDisabledFileEvent(event, "dragleave")) return;

    if (!hasFilePayload(event)) {
      if (isFileDragging.value) resetFileDragState();
      return;
    }

    preventFileDropDefault(event);

    if (isMovingInsideCurrentTarget(event)) return;

    resetFileDragState();
  }

  function handleDrop(event) {
    if (guardDisabledFileEvent(event, "drop")) return;
    if (!hasFilePayload(event)) return;

    preventFileDropDefault(event);

    const files = Array.from(event.dataTransfer?.files || []);
    resetFileDragState();

    if (!files.length) return;

    if (typeof onDropFiles === "function") {
      onDropFiles(files, event);
    }
  }

  useEventListener(targetRef, "dragenter", handleDragEnter);
  useEventListener(targetRef, "dragover", handleDragOver);
  useEventListener(targetRef, "dragleave", handleDragLeave);
  useEventListener(targetRef, "drop", handleDrop);
  function handleWindowDragLeave(event) {
    if (!isFileDragging.value) return;
    if (isLeavingViewport(event)) resetFileDragState();
  }

  useEventListener(window, "dragend", resetFileDragState);
  useEventListener(window, "drop", resetFileDragState);
  useEventListener(window, "blur", resetFileDragState);
  useEventListener(window, "dragleave", handleWindowDragLeave);

  watch(isFileDropEnabled, (enabledValue) => {
    if (!enabledValue) resetFileDragState();
  });

  return {
    isFileDragging,
    isFileDropEnabled,
    isFileDropDisabled,
    resetFileDragState,
  };
}
