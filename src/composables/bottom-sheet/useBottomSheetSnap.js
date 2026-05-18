import {BOTTOM_SHEET_SNAP_RATIO} from "@/constants/uiTokens";

/**
 * @description 바텀시트 snap 높이 변경 로직을 관리합니다.
 * @param {object} options - snap 계산에 필요한 상태입니다.
 * @param {object} options.props - 바텀시트 props입니다.
 * @param {import('vue').Ref<number>} options.currentHeight - 현재 높이 ref입니다.
 * @param {import('vue').Ref<string>} options.currentSnap - 현재 snap ref입니다.
 * @param {Function} options.clampHeight - 높이 clamp 함수입니다.
 * @param {Function} options.getViewportHeight - viewport 높이 함수입니다.
 * @returns {object} setHeight/expand/collapse 함수입니다.
 */
export function createBottomSheetSnap(options) {
  const {props, currentHeight, currentSnap, clampHeight, getViewportHeight} =
    options;

  function setHeight(height, snap = "custom") {
    currentHeight.value = clampHeight(height);
    currentSnap.value =
      currentHeight.value >=
      getViewportHeight() * BOTTOM_SHEET_SNAP_RATIO.fullThreshold
        ? "full"
        : snap;
  }

  function expand() {
    setHeight(getViewportHeight() * props.maxRatio, "full");
  }

  function collapse() {
    setHeight(props.minHeight, "min");
  }

  return {
    collapse,
    expand,
    setHeight,
  };
}
