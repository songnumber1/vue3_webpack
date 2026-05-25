/**
 * @file composables/bottom-sheet/useBottomSheetSnap.js
 * @description 모바일 BottomSheet의 drag, size, viewport 보정을 담당합니다. keyboard/VisualViewport 영향이 크므로 동작 변경에 주의해야 합니다.
 *
 * 프리징 코드 주석 기준:
 * - 이 주석은 코드 추적을 돕기 위한 설명이며 런타임 동작을 변경하지 않습니다.
 * - 함수/상태가 다른 composable, store, component로 전달되는 경우 호출 방향을 먼저 확인하세요.
 */

import {BOTTOM_SHEET_SNAP_RATIO} from "@/platform/viewport/viewportConstants";

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
