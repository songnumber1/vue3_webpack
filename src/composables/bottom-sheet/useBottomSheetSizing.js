/**
 * @file composables/bottom-sheet/useBottomSheetSizing.js
 * @description 모바일 BottomSheet의 drag, size, viewport 보정을 담당합니다. keyboard/VisualViewport 영향이 크므로 동작 변경에 주의해야 합니다.
 *
 * 프리징 코드 주석 기준:
 * - 이 주석은 코드 추적을 돕기 위한 설명이며 런타임 동작을 변경하지 않습니다.
 * - 함수/상태가 다른 composable, store, component로 전달되는 경우 호출 방향을 먼저 확인하세요.
 */

import {computed, nextTick, onBeforeUnmount, ref, watch} from "vue";
import {useScrollLock} from "@vueuse/core";
import {createBottomSheetDrag} from "./useBottomSheetDrag";
import {createBottomSheetSnap} from "./useBottomSheetSnap";
import {
  createBottomSheetViewport,
  createBottomSheetViewportListeners,
  createBottomSheetViewportScheduler,
} from "./useBottomSheetViewport";

/**
 * @description 바텀시트 크기, snap, drag, viewport listener를 조합합니다.
 * @param {object} props - BaseBottomSheet props입니다.
 * @param {Function} emit - BaseBottomSheet emit 함수입니다.
 * @returns {object} BaseBottomSheet에서 사용하는 ref와 제어 함수입니다.
 */
export function useBottomSheetSizing(props, emit) {
  // 최상위 외곽 바텀 시트 박스 뼈대를 가리키는 돔 레퍼런스 포인터
  const sheetRef = ref(null);
  // 내부 가변 텍스트 콘텐츠 및 옵션들이 담기는 스크롤 바디 영역의 돔 레퍼런스 포인터
  const bodyRef = ref(null);
  // 포인터 트래킹 드래그 세션이 가동 중인지 나타내는 플래그
  const dragging = ref(false);
  // 런타임 연산을 거쳐 DOM 스타일에 즉시 투영될 실제 가변 픽셀 높이 상태 변수
  const currentHeight = ref(320);
  // 현재 도달해 안착해 있는 스냅 상태 단계 코드 ("content" | "expanded" 등)
  const currentSnap = ref("content");

  // SSR 안전 가드 바인딩: 서버 사이드 환경에서는 도큐먼트가 부재하므로 예외를 우회하고, 클라이언트 런타임 시에만 배경 스크롤 제어 잠금 활성화
  const bodyScrollLocked =
    typeof document === "undefined" ? ref(false) : useScrollLock(document.body);

  // 브라우저 프레임 갱신 주기(RAF) 또는 타임아웃 타이머의 메모리 리크 회수를 위한 트래킹 식별 번호
  let measureRaf = 0;
  // 하위 콘텐츠가 비동기(다국어 팩 로딩, 동적 리스트 인입)로 변동될 때 높이를 재연산하기 위한 네이티브 감시 장치 포인터
  let bodyObserver = null;

  // 계산된 실시간 높이 픽셀 수치를 CSS 변수(--bottom-sheet-height) 형태로 변환하여 컴포넌트 스타일에 다이렉트 주입하는 컴퓨티드 속성
  const sheetStyle = computed(() => ({
    "--bottom-sheet-height": `${Math.round(currentHeight.value)}px`,
  }));

  // 1. 뷰포트 측정 모듈 생성: 바텀시트 각 파츠 돔의 가용 길이를 계산하는 기하학 엔진 마운트
  const viewport = createBottomSheetViewport({
    bodyRef,
    props,
    sheetRef,
  });

  // 2. 스냅 제어 모듈 생성: 최소/최대 영역 락킹 및 강제 확장(expand)/축소(collapse) 제어 레버 빌드
  const {collapse, expand, setHeight} = createBottomSheetSnap({
    clampHeight: viewport.clampHeight,
    currentHeight,
    currentSnap,
    getViewportHeight: viewport.getViewportHeight,
    props,
  });

  // 3. 스케줄러 생성: 리사이즈 등의 연산 요동(Churn) 현상을 압축 래핑하는 배치 업데이트 큐 바인딩
  const {scheduleViewportRefresh, clearViewportRefresh} =
    createBottomSheetViewportScheduler({
      currentHeight,
      currentSnap,
      props,
      setHeight,
    });

  // 4. 리스너 연동: 윈도우 전역 해상도 변동(orientationchange, resize) 이벤트를 스케줄러 큐에 다이렉트 브릿지 연결
  const {registerViewportListeners, unregisterViewportListeners} =
    createBottomSheetViewportListeners(scheduleViewportRefresh);

  // 5. 드래그 제어 연동: 터치/마우스 포인터의 물리 이동 델타값을 연산하여 높이에 실시간 하이드레이션하는 가동 장치 결합
  const {cleanupDrag, startDrag} = createBottomSheetDrag({
    currentHeight,
    dragging,
    emit,
    expand,
    getViewportHeight: viewport.getViewportHeight,
    props,
    setHeight,
  });

  /**
   * @description 시트가 열리는 최초 국면에 기하학적 뷰포트 상태를 기반으로 초기 진입 지점 높이를 계산하여 업데이트를 집행합니다.
   */
  function measureOpeningHeight() {
    setHeight(viewport.getInitialHeight(), props.initialSnap);
  }

  /**
   * @description 레이아웃 스레드 충돌을 원천 방어하기 위해 기존 예약된 타이머를 취소하고, Vue 돔 패치 이후 가장 안전한 애니메이션 프레임(RAF) 타스크 경계면에 초기 높이 연산을 정렬 예약합니다.
   */
  function resetHeight() {
    window.cancelAnimationFrame?.(measureRaf);
    nextTick(() => {
      measureRaf = window.requestAnimationFrame
        ? window.requestAnimationFrame(measureOpeningHeight)
        : window.setTimeout(measureOpeningHeight, 0); // 가상 환경 및 RAF 미지원 구형 브라우저 전용 폴백 매핑
    });
  }

  /**
   * @description 바텀 시트 스크롤 바디 내부의 자식 태그 구조나 텍스트 글자 세트가 비동기로 가변 가감될 때, 이를 실시간 추적하여 시트 높이를 자석처럼 리사이즈 업데이트해 주는 네이티브 옵저버 스레드를 개통합니다.
   */
  function observeBodySize() {
    bodyObserver?.disconnect?.(); // 기존에 잔존하던 옵저버 인터페이스가 있다면 메모리 안전 탈거 수거
    if (typeof MutationObserver === "undefined" || !bodyRef.value) return; // SSR 가드 및 돔 미마운트 시 예외 이탈

    // 변화가 포착되면 리사이즈 배치 압축 스케줄러 업데이트 큐 호출 트리거 투척
    bodyObserver = new MutationObserver(scheduleViewportRefresh);
    bodyObserver.observe(bodyRef.value, {
      childList: true, // 자식 노드의 추가/제거 상태 추적 감시
      subtree: true, // 하위 뎁스 깊숙이 존재하는 딥 자식 엘리먼트 노드까지 전역 추적 감시
      characterData: true, // 텍스트 글자 노드 내부의 단순 문자열 변동 정보까지 디테일 추적 감시
    });
  }

  /**
   * @description 가비지 컬렉션(GC) 유도 및 불필요한 백그라운드 돔 추적 연산 버스트를 차단하기 위해 감시 장치를 전격 파괴 폐쇄합니다.
   */
  function disconnectBodyObserver() {
    bodyObserver?.disconnect?.();
    bodyObserver = null;
  }

  /**
   * @description 바텀시트 오픈 시 뒷배경 웹페이지 본문 영역이 제멋대로 스크롤되어 사용자 인지 부조화를 유발하는 현상을 차단하기 위해 네이티브 바디 스크롤 락을 점등합니다.
   */
  function lockBodyScroll() {
    bodyScrollLocked.value = true;
  }

  /**
   * @description 시트 종료 국면 시 본문 스크롤 기능을 정상 복구시킵니다.
   */
  function unlockBodyScroll() {
    bodyScrollLocked.value = false;
  }

  // 사용자의 실시간 가시성 토글(props.open) 플래그 변화를 상시 추적하여, 각 생명주기별 플랫폼 리스너 장착 및 해제 클린업 시퀀스 일괄 통제
  watch(
    () => props.open,
    (isOpen) => {
      if (isOpen) {
        lockBodyScroll(); // 1. 배경 화면 스크롤 차단 락
        resetHeight(); // 2. 초기 기하학 높이 계산 태스크 큐 예약
        registerViewportListeners(); // 3. 디바이스 리사이즈 감시 전대전 가동
        nextTick(observeBodySize); // 4. 내부 콘텐츠 변동 트래킹 옵저버 안착
      } else {
        unlockBodyScroll(); // 닫힐 시 가드 전면 해제 및 메모리 소멸 정리
        disconnectBodyObserver();
        unregisterViewportListeners();
      }
    },
    {immediate: true} // 컴포넌트 최초 마운트 시점의 원시 초기 상태값 검증을 위해 즉시 실행 옵션 체결
  );

  // 컴포넌트 소멸(unmount) 직전, 가동 중이던 모든 타이머 버스 및 네이티브 전전후 리스너들을 소멸 수거하여 완벽한 메모리 누수 제로 환경 달성
  onBeforeUnmount(() => {
    unlockBodyScroll();
    clearViewportRefresh();
    if (measureRaf) window.cancelAnimationFrame?.(measureRaf);
    cleanupDrag();
    disconnectBodyObserver();
    unregisterViewportListeners();
  });

  // 최종 완성된 결합 구조체 레버 패키지 배출 리턴
  return {
    bodyRef,
    collapse,
    currentSnap,
    dragging,
    expand,
    sheetRef,
    sheetStyle,
    startDrag,
  };
}
