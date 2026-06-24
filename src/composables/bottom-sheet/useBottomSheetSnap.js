/**
 * @file composables/bottom-sheet/useBottomSheetSnap.js
 * @description 모바일 BottomSheet의 drag, size, viewport 보정을 담당합니다. keyboard/VisualViewport 영향이 크므로 동작 변경에 주의해야 합니다.
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

  /**
   * @description 타깃 수치 높이를 전달받아 보정 엔진을 거친 후, 특정 임계값 비율 조건 검증을 거쳐 최종 반응형 픽셀 높이와 스냅 명칭 상태를 동기 최신화합니다.
   * @param {number} height - 변화시키고자 하는 목적지 픽셀 높이 수치
   * @param {string} [snap="custom"] - 이번 회차 높이 변동을 유발한 스냅 모드 식별자 명칭
   * @returns {void}
   */
  function setHeight(height, snap = "custom") {
    // 1. 입력된 높이가 바텀시트가 허용하는 최소/최대 안전 범위를 훼손하지 않도록 클램핑 보정을 거쳐 렌더 버퍼에 다이렉트 하이드레이션
    currentHeight.value = clampHeight(height);

    // 2. [스냅 상태 판정 공식]: 보정 가공 완료된 최종 높이가 디바이스 전체 뷰포트 높이 대비 정해진 '가득 참 임계값 배율'(예: 95% 이상)을 초과 돌파했는지 판별
    currentSnap.value =
      currentHeight.value >=
      getViewportHeight() * BOTTOM_SHEET_SNAP_RATIO.fullThreshold
        ? "full" // 조건 충족 시 완전 확장 코드인 "full" 상태로 강제 락킹 마킹
        : snap; // 이외의 중간 조절 국면인 경우 주입받은 원시 스냅 명세 코드("content", "min", "custom" 등)를 그대로 유지
  }

  /**
   * @description 컴포넌트 Props에 지정된 최대 가용 화면 높이 배율(`props.maxRatio`) 수치를 계산하여 바텀 시트를 전체 화면 보기(Full Expand) 시퀀스로 강제 전환합니다.
   * @returns {void}
   */
  function expand() {
    // 뷰포트 총 길이에 허용치 배율(예: 0.9)을 상산하여 스냅 코드를 "full"로 지정 후 업데이트 단행
    setHeight(getViewportHeight() * props.maxRatio, "full");
  }

  /**
   * @description 컴포넌트 Props에 지정된 최소 보장 하한선 높이(`props.minHeight`) 수치를 타깃으로 지정하여 바텀 시트를 최소 요약 보기(Collapse) 시퀀스로 강제 복귀시킵니다.
   * @returns {void}
   */
  function collapse() {
    // 최소 픽셀값 앵커를 지정하고 스냅 코드를 "min" 상태로 강제 전환
    setHeight(props.minHeight, "min");
  }

  // 상위 BottomSheet 컴포넌트 및 드래그 핸들러에서 탈취 조작할 타깃 인터페이스 레버 리턴
  return {
    collapse,
    expand,
    setHeight,
  };
}
