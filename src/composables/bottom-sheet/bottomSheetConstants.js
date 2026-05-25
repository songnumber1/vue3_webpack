/**
 * @file composables/bottom-sheet/bottomSheetConstants.js
 * @description 모바일 BottomSheet의 drag, size, viewport 보정을 담당합니다. keyboard/VisualViewport 영향이 크므로 동작 변경에 주의해야 합니다.
 *
 * 프리징 코드 주석 기준:
 * - 이 주석은 코드 추적을 돕기 위한 설명이며 런타임 동작을 변경하지 않습니다.
 * - 함수/상태가 다른 composable, store, component로 전달되는 경우 호출 방향을 먼저 확인하세요.
 */

/**
 * @constant {number} MIN_VISIBLE_OPTION_COUNT
 * @description 바텀 시트가 최초로 펼쳐졌을 때, 내부 스크롤이 생기더라도 사용자에게 '최소한 이 개수만큼의 옵션 리스트는 화면에 잘리지 않고 완전히 보여야 한다'는 것을 보장하기 위한 최소 가시 옵션 개수 기준점입니다.
 */
export const MIN_VISIBLE_OPTION_COUNT = 3;

/**
 * @constant {number} DEFAULT_OPTION_HEIGHT_PX
 * @description 바텀 시트 내부를 구성하는 개별 리스트 아이템(Button 또는 로우)의 네이티브 디자인 가이드 상 기본 세로 높이 수치입니다. (단위: 픽셀)
 */
export const DEFAULT_OPTION_HEIGHT_PX = 58;

/**
 * @constant {number} DEFAULT_SHEET_CHROME_HEIGHT_PX
 * @description 순수 옵션 리스트 영역을 제외하고, 바텀 시트의 레이아웃을 유지하기 위해 고정적으로 차지하는 크롬 영역(상단 타이틀 바, 헤더, 드래그 핸들 바, 하단 패딩 및 안전 영역 등)의 총합 뼈대 높이 수치입니다. (단위: 픽셀)
 */
export const DEFAULT_SHEET_CHROME_HEIGHT_PX = 122;
