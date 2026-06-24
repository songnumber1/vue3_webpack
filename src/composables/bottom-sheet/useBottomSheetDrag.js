/**
 * @file composables/bottom-sheet/useBottomSheetDrag.js
 * @description 모바일 BottomSheet의 drag, size, viewport 보정을 담당합니다. keyboard/VisualViewport 영향이 크므로 동작 변경에 주의해야 합니다.
 */

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

  // 유저가 최초 드래그 포인트를 찍었을 때의 Y축 클라이언트 원시 좌표 (이동 변위 추적 기준점)
  let dragStartY = 0;
  // 드래그를 막 시작하는 찰나에 바텀 시트가 가지고 있던 본래의 시작 높이 수치 스냅샷
  let dragStartHeight = 0;

  // 가비지 컬렉션(GC) 및 이벤트 리스너 중복 방지를 위한 동적 윈도우 버스 리무버 클로저 포인터 모음
  let stopPointerMove = null;
  let stopPointerUp = null;
  let stopPointerCancel = null;

  /**
   * @description 상단 포인터 터치 핸들 바 영역에 최초 포인터 다운(`pointerdown`) 이벤트 징후가 포착되었을 때 드래그 세션을 초기화 및 개통합니다.
   * @param {PointerEvent} event - 브라우저 네이티브 포인터 이벤트 객체
   * @returns {void}
   */
  function startDrag(event) {
    // 다중 터치 방어 가드: 일반 마우스가 아니고 멀티 터치 환경에서 첫 번째 주 터치가 아닌 서브 터치인 경우 오작동 차단
    if (event.pointerType !== "mouse" && event.isPrimary === false) return;

    // 모바일 크롬 브라우저 등에서 발생하는 네이티브 스크롤 풀다운 리프레시 및 고유 이벤트를 일시 정지
    event.preventDefault?.();

    // 현재 제어 파이프라인 전체를 '드래그 활성화' 상태로 변환
    dragging.value = true;
    // 시작 시점의 Y 좌표 및 본래 바텀시트의 오리지널 픽셀 높이를 세션 메모리에 동기 록인(Lock-in)
    dragStartY = event.clientY;
    dragStartHeight = currentHeight.value;

    try {
      // 포인터 캡처 수립: 포인터가 하드웨어 화면 경계 영역 바깥이나 버튼 픽셀 밖으로 튕겨 나가더라도 드래그 이벤트를 놓치지 않고 해당 엘리먼트로 유선 추적 락(Lock)을 거는 브라우저 네이티브 고급 API 단행
      event.currentTarget?.setPointerCapture?.(event.pointerId);
    } catch (error) {
      void error; // 특정 브라우저 환경에서 캡처 지원 중단 등으로 인한 크래시 오작동 방어 마스킹
    }

    // 전역 윈도우 스코프에 런타임 이벤트 바인딩 처리 (과도한 렌더 가동을 실시간 제어하기 위해 passive 옵션을 false로 지정)
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

  /**
   * @description 유저가 마우스 버튼을 누른 채로 움직이거나 모바일 화면을 드래그하여 드롭하기 직전까지의 실시간 마우스 이벤트를 수집 처리합니다.
   * @param {PointerEvent} event - 브라우저 네이티브 포인터 무브 이벤트 객체
   * @returns {void}
   */
  function handleDrag(event) {
    // 예외 가드: 비정상적인 버스트나 세션 탈거 상태에서 무브 이벤트가 난입했을 때 즉각 연산 회피 처리
    if (!dragging.value) return;
    event.preventDefault();

    // [중요 수학 공식 - 변위 계산]: 마우스 좌표는 화면 아래로 내려갈수록 증가(clientY)하므로, 바텀 시트의 '위로 끌어올리는 역방향 레이아웃 성질'을 맞추기 위해 '시작점Y - 현재점Y' 구조로 델타 변량 연산 구현
    const delta = dragStartY - event.clientY;

    // 원래 가지고 있던 고유 높이에 변위량을 상산 결합하여 바텀시트 외부 가변 높이 필드에 무한 주입 반영
    setHeight(dragStartHeight + delta);
  }

  /**
   * @description 유저가 손가락을 화면에서 완전히 떼거나 마우스 클릭 버튼을 릴리즈(`pointerup`)했을 때, 현재 적체된 높이를 기준으로 최대 확장시킬지 혹은 창을 소멸시킬지 임계값을 스냅 진단합니다.
   * @returns {void}
   */
  function stopDrag() {
    if (!dragging.value) return;
    dragging.value = false; // 드래그 파이프라인 세션 종료 마킹
    cleanupDrag(); // 윈도우 전역에 장착했던 일회성 이벤트 버스 탈거 수거

    const viewportHeight = getViewportHeight(); // 가용 화면 디바이스 세로 총 길이 추출

    // 케이스 1: 사용자가 정해진 확장 임계값 비율(예: 화면 높이의 75% 이상) 이상으로 높이 올렸다면 가득 찬 전체 화면으로 강제 동기화 확장
    if (
      currentHeight.value >
      viewportHeight * BOTTOM_SHEET_SNAP_RATIO.expandThreshold
    ) {
      expand();
    }
    // 케이스 2: 사용자가 정해진 최소 폐쇄 임계값 비율(예: 컴포넌트 최소 높이의 50% 미만) 이하로 바닥으로 끌어내렸다면 닫기 콜백 작동 트리거 호출
    else if (
      currentHeight.value <
      props.minHeight * BOTTOM_SHEET_SNAP_RATIO.closeThreshold
    ) {
      emit("close");
    }
    // 케이스 3: 그 사이 중간 모호한 영역에 걸쳐 있다면 컴포넌트 내부 높이 보정 로직이 기본 props.minHeight 등으로 알아서 자석처럼 원복 복귀 스냅을 처리함
  }

  /**
   * @description 메모리 리크(Memory Leak) 방지 및 좀비 이벤트 전동을 원천 제거하기 위해 동적으로 연결했던 3대 전역 포인터 감시자 리스너 채널을 즉각 파괴 회수합니다.
   * @returns {void}
   */
  function cleanupDrag() {
    stopPointerMove?.();
    stopPointerUp?.();
    stopPointerCancel?.();
    stopPointerMove = null;
    stopPointerUp = null;
    stopPointerCancel = null;
  }

  // 컴포넌트 생명주기 마운트 및 핸들바 템플릿 바인딩 시점에서 조작할 타깃 메서드 패키지 배출 리턴
  return {
    cleanupDrag,
    startDrag,
  };
}
