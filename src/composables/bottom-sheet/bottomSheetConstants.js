/**
 * @file composables/bottom-sheet/bottomSheetConstants.js
 * @description 모바일 BottomSheet의 drag, size, viewport 보정을 담당합니다. keyboard/VisualViewport 영향이 크므로 동작 변경에 주의해야 합니다.
 *
 * 프리징 코드 주석 기준:
 * - 이 주석은 코드 추적을 돕기 위한 설명이며 런타임 동작을 변경하지 않습니다.
 * - 함수/상태가 다른 composable, store, component로 전달되는 경우 호출 방향을 먼저 확인하세요.
 */

export const MIN_VISIBLE_OPTION_COUNT = 3;
export const DEFAULT_OPTION_HEIGHT_PX = 58;
export const DEFAULT_SHEET_CHROME_HEIGHT_PX = 122;
