/**
 * @file composables/bottom-sheet/useBottomSheetSafeArea.js
 * @description 모바일 BottomSheet의 drag, size, viewport 보정을 담당합니다. keyboard/VisualViewport 영향이 크므로 동작 변경에 주의해야 합니다.
 *
 * 프리징 코드 주석 기준:
 * - 이 주석은 코드 추적을 돕기 위한 설명이며 런타임 동작을 변경하지 않습니다.
 * - 함수/상태가 다른 composable, store, component로 전달되는 경우 호출 방향을 먼저 확인하세요.
 */

import {getSafeAreaBottom} from "@/platform/viewport/viewport";

/**
 * @description 바텀시트 최대 높이 계산에 필요한 safe-area 하단 값을 읽습니다.
 * @returns {number} 현재 브라우저의 safe-area 하단 보정값입니다.
 */
export function readBottomSheetSafeAreaBottom() {
  return getSafeAreaBottom();
}
