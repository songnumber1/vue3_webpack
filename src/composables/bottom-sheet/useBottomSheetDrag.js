import {useEventListener} from "@vueuse/core";
import {BOTTOM_SHEET_SNAP_RATIO} from "@/platform/viewport/viewportConstants";

/**
 * @description 바텀시트 pointer drag 흐름을 기존 동작 그대로 분리 관리합니다.
 * @param {object} options - drag 상태와 높이 제어 함수입니다.
 * @param {object} options.props - 바텀시트 props입니다.
 * @param {import('vue').Ref<boolean>} options.dragging - 드래그 여부 ref입니다.
 * @param {import('vue').Ref<number>} options.currentHeight - 현재 높이 ref입니다.
 * @param {Function} options.setHeight - 높이 적용 함수입니다.
 * @param {Function} options.expand - full snap 함수입니다.
 * @param {Function} options.getViewportHeight - viewport 높이 함수입니다.
 * @param {Function} options.emit - Vue emit 함수입니다.
 * @returns {object} startDrag/cleanupDrag 함수입니다.
 */
export function createBottomSheetDrag(options) {
  const {
    props,
    dragging,
    currentHeight,
    setHeight,
    expand,
    getViewportHeight,
    emit,
  } = options;

  let dragStartY = 0;
  let dragStartHeight = 0;
  let stopPointerMove = null;
  let stopPointerUp = null;
  let stopPointerCancel = null;

  function startDrag(event) {
    if (event.pointerType !== "mouse" && event.isPrimary === false) return;
    event.preventDefault?.();
    dragging.value = true;
    dragStartY = event.clientY;
    dragStartHeight = currentHeight.value;
    try {
      event.currentTarget?.setPointerCapture?.(event.pointerId);
    } catch (error) {
      void error;
    }
    stopPointerMove = useEventListener(window, "pointermove", handleDrag, {
      passive: false,
    });
    stopPointerUp = useEventListener(window, "pointerup", stopDrag, {
      passive: true,
    });
    stopPointerCancel = useEventListener(window, "pointercancel", stopDrag, {
      passive: true,
    });
  }

  function handleDrag(event) {
    if (!dragging.value) return;
    event.preventDefault();
    const delta = dragStartY - event.clientY;
    setHeight(dragStartHeight + delta);
  }

  function stopDrag() {
    if (!dragging.value) return;
    dragging.value = false;
    cleanupDrag();

    const viewportHeight = getViewportHeight();
    if (
      currentHeight.value >
      viewportHeight * BOTTOM_SHEET_SNAP_RATIO.expandThreshold
    ) {
      expand();
    } else if (
      currentHeight.value <
      props.minHeight * BOTTOM_SHEET_SNAP_RATIO.closeThreshold
    ) {
      emit("close");
    }
  }

  function cleanupDrag() {
    stopPointerMove?.();
    stopPointerUp?.();
    stopPointerCancel?.();
    stopPointerMove = null;
    stopPointerUp = null;
    stopPointerCancel = null;
  }

  return {
    cleanupDrag,
    startDrag,
  };
}
