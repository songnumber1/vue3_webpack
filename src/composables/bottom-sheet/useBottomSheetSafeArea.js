import {getSafeAreaBottom} from "@/platform/viewport/viewport";

/**
 * @description 바텀시트 최대 높이 계산에 필요한 safe-area 하단 값을 읽습니다.
 * @returns {number} 현재 브라우저의 safe-area 하단 보정값입니다.
 */
export function readBottomSheetSafeAreaBottom() {
  return getSafeAreaBottom();
}
