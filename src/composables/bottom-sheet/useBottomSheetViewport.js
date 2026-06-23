/**
 * @file composables/bottom-sheet/useBottomSheetViewport.js
 * @description 모바일 BottomSheet의 drag, size, viewport 보정을 담당합니다. keyboard/VisualViewport 영향이 크므로 동작 변경에 주의해야 합니다.
 *
 * 프리징 코드 주석 기준:
 * - 이 주석은 코드 추적을 돕기 위한 설명이며 런타임 동작을 변경하지 않습니다.
 * - 함수/상태가 다른 composable, store, component로 전달되는 경우 호출 방향을 먼저 확인하세요.
 */

import {useEventListener} from "@vueuse/core";
import {useSystemSettingsStore} from "@/stores/systemSettingsStore";
import {
  BOTTOM_SHEET_REFRESH_EVENTS,
  BOTTOM_SHEET_SNAP_RATIO,
  BOTTOM_SHEET_VIEWPORT_REFRESH_DELAY_MS,
  MOBILE_BREAKPOINT_PX,
} from "@/platform/viewport/viewportConstants";
import {
  getSafeAreaBottom,
  getViewportHeight as readViewportHeight,
  isMobileViewport as readIsMobileViewport,
} from "@/platform/viewport/viewport";
import {
  DEFAULT_OPTION_HEIGHT_PX,
  DEFAULT_SHEET_CHROME_HEIGHT_PX,
  MIN_VISIBLE_OPTION_COUNT,
} from "./bottomSheetConstants";

/**
 * @description 바텀시트 viewport/크기 계산 전용 유틸을 생성합니다.
 * @param {object} options - 바텀시트 계산에 필요한 props/ref 상태입니다.
 * @param {object} options.props - 바텀시트 props입니다.
 * @param {import('vue').Ref<HTMLElement|null>} options.sheetRef - sheet DOM ref입니다.
 * @param {import('vue').Ref<HTMLElement|null>} options.bodyRef - body DOM ref입니다.
 * @returns {object} viewport 및 높이 계산 함수 묶음입니다.
 */
export function createBottomSheetViewport(options) {
  const {props, sheetRef, bodyRef} = options;

  // 피나(Pinia) 시스템 설정 전역 스토어로부터 하드웨어 혹은 어드민 레이어에서 강제 지정한 시트 최소/최대 높이 제한 영역 경계값을 안전하게 조회합니다.
  function getSystemBottomSheetBounds() {
    try {
      const store = useSystemSettingsStore();
      return {
        minHeight: Number(store.bottomSheetMinHeight) || props.minHeight, // 시스템 스토어 설정을 1순위로 채택하되, 부재 시 컴포넌트 Props 기본 하한선 백업
        maxHeight: Number(store.bottomSheetMaxHeight) || 0, // 0은 시스템 차원의 강제 상한선 제한이 없음을 의미
      };
    } catch (_error) {
      return {minHeight: props.minHeight, maxHeight: 0}; // SSR 환경 등 스토어 접근 불가 시 예외 오작동 방어 폴백
    }
  }

  // 모바일 가상 키보드가 팝업되었을 때 실시간으로 압축되는 실제 가시 화면 영역 높이(VisualViewport.height)를 픽셀 단위로 측정합니다.
  function getViewportHeight() {
    return readViewportHeight();
  }

  // 기기의 현재 미디어 해상도 너비가 사전에 정의된 모바일 브레이크포인트(예: 768px) 미만의 모바일 레이아웃 상태인지 진단합니다.
  function isMobileViewport() {
    return readIsMobileViewport(MOBILE_BREAKPOINT_PX);
  }

  // 리스트 옵션들을 제외한 바텀 시트 고유의 뼈대 구성품(드래그 놉 영역 + 타이틀 헤더 바 + 테두리 패딩 및 보정 상산값)의 합산 픽셀 높이를 동적 계산합니다.
  function getSheetChromeHeight() {
    const sheet = sheetRef.value;
    if (!sheet) return DEFAULT_SHEET_CHROME_HEIGHT_PX; // 돔 미마운트 상태일 시 정적 기본 상수값으로 우회 안전 리턴

    const dragArea = sheet.querySelector(".bottom-sheet-drag-area"); // 최상단 터치 드래그 바 컴포넌트 포인터 취득
    const header = sheet.querySelector(".bottom-sheet-header"); // 시트 타이틀 텍스트 영역 포인터 취득
    const style = window.getComputedStyle(sheet); // 하단 영역 CSS 고유 패딩값 추출을 위한 스타일 추적 객체 선언
    const paddingBottom = Number.parseFloat(style.paddingBottom || "0") || 0; // 문자열 패딩값을 소수점 포함 숫자형 변환 처리

    // 기하학적 컴포지트 수치 연산: 각 영역의 바운딩 박스 실측치와 패딩, 오차 보정치(18px)를 병합한 뒤 정수로 올림 처리
    return Math.ceil(
      (dragArea?.getBoundingClientRect().height || 28) +
        (header?.getBoundingClientRect().height || 50) +
        paddingBottom +
        18
    );
  }

  // 사용자가 최소 가시 개수(MIN_VISIBLE_OPTION_COUNT = 3)만큼의 옵션 로우를 잘림 현상 없이 완전하게 볼 수 있도록 보장하는 콘텐츠 최소 물리 영역 높이를 연산합니다.
  function getMinimumVisibleBodyHeight() {
    const body = bodyRef.value;
    const options = Array.from(
      body?.querySelectorAll?.(".bottom-sheet-option") || []
    ); // 바디 내부의 옵션 리스트 돔 엘리먼트들을 동적 순회 배열로 구조화

    // 만약 데이터 가동 전이라 내부 옵션 태그가 존재하지 않는다면 정적 예측 기본 수치 공식(3개 * 58px)을 산출하여 탈출
    if (!options.length) {
      return DEFAULT_OPTION_HEIGHT_PX * MIN_VISIBLE_OPTION_COUNT;
    }

    // 상위 3개 노드를 슬라이싱하여 각 엘리먼트의 실제 높이를 가산하되, 렌더링 전(0px)인 특이 케이스는 상수의 기본 단위를 대치 결합
    const totalOptionHeight = options
      .slice(0, MIN_VISIBLE_OPTION_COUNT)
      .reduce((sum, option) => {
        const height = option.getBoundingClientRect().height;
        return sum + (height > 0 ? height : DEFAULT_OPTION_HEIGHT_PX);
      }, 0);

    return Math.ceil(totalOptionHeight + 12); // 하부 스크롤 바운스 여유폭 12px를 완충제로 더한 최종 최소 높이 반환
  }

  // 내부 스크롤 바디 컴포넌트가 품고 있는 가변 리스트 자식 노드들의 순수 전체 콘텐츠 콘텐츠 높이 합산값을 도출합니다.
  function getBodyContentHeight() {
    const body = bodyRef.value;
    if (!body) return 0;

    const children = Array.from(body.children || []);
    if (!children.length) return body.scrollHeight || 0; // 자식 요소 부재 시 엘리먼트 네이티브 스크롤 높이 포인터로 직행 바이패스

    // 자식 엘리먼트들을 전부 축적 순회하며 논리 렌더링 영역 높이 누적 연산 진행
    const contentHeight = children.reduce((sum, child) => {
      const height = child.getBoundingClientRect().height;
      return sum + (height > 0 ? height : child.scrollHeight || 0);
    }, 0);

    const style = window.getComputedStyle(body); // 바디 내부에 결합된 스타일 사전 획득
    const paddingTop = Number.parseFloat(style.paddingTop || "0") || 0; // 상단 내부 여백 픽셀 수치화
    const paddingBottom = Number.parseFloat(style.paddingBottom || "0") || 0; // 하단 내부 여백 픽셀 수치화

    return Math.ceil(contentHeight + paddingTop + paddingBottom); // 순수 텍스트/버튼 총합에 상하단 패딩을 가미한 올림 수치 최종 연산
  }

  // 플랫폼 분기 및 뼈대 수치를 기반으로, 이 바텀 시트가 물리적으로 축소될 수 있는 최종 최하한선 절대 높이(픽셀)를 확정합니다.
  function getMinimumSheetHeight() {
    const {minHeight} = getSystemBottomSheetBounds();
    if (!isMobileViewport()) return props.minHeight; // 모바일 뷰포트가 아닌 와이드 데스크톱 모드일 때는 Props 원품 설정을 그대로 관철

    // 모바일인 경우: 시스템 지정 최소 하한선과 (크롬 영역 높이 + 3개 옵션 보장 높이) 중 더 큰 값을 최종 마지노선 최소 높이로 타협 선택
    return Math.max(
      minHeight,
      getSheetChromeHeight() + getMinimumVisibleBodyHeight()
    );
  }

  // 사용자가 임의로 마우스를 드래그하여 높이를 훼손하거나 변경할 때, 화면 밖 이탈을 차단하기 위해 상하한선 경계면 범위 내로 높이를 강제 억류(클램핑)합니다.
  function clampHeight(height) {
    const viewportHeight = getViewportHeight(); // 가용 뷰포트 전체 높이 로드
    const preferredMinHeight = getMinimumSheetHeight(); // 유효 최소 보장 하한선 로드
    const systemBounds = getSystemBottomSheetBounds(); // 시스템 스토어 경계면 데이터 로드

    // [최대 상한선 공식]: '전체 뷰포트 * 허용 최대 배율' 공식에서 노치 디바이스 및 아이폰 하단 홈 바 영역(`SafeAreaBottom`) 픽셀을 추가로 차감하여 안전 상한선 도출
    const ratioMaxHeight =
      Math.floor(viewportHeight * props.maxRatio) -
      getSafeAreaBottom();

    // 시스템 관리자 설정 상한선 규격이 존재하는 경우, 비율 상한선과 비교하여 더 타이트한(작은) 상한선 수치를 최종 타깃으로 확정
    const configuredMaxHeight = systemBounds.maxHeight
      ? Math.min(systemBounds.maxHeight, ratioMaxHeight)
      : ratioMaxHeight;

    const maxHeight = Math.max(preferredMinHeight, configuredMaxHeight); // 최대 상한선이 최소 하한선보다 붕괴되어 작아지는 논리 모순 오류 원천 방어 가드
    const minHeight = Math.min(preferredMinHeight, maxHeight); // 최소 하한선 수치 유효성 정렬 검증

    return Math.min(Math.max(height, minHeight), maxHeight); // 최종 입력값 수학적 클램프 중첩 실행 [minHeight <= 결과 <= maxHeight]
  }

  // 외곽 크롬 영역과 내부 리스트 아이템, 그리고 미세 완충 마진(8px)을 조합하여 현재 바텀 시트가 품은 데이터의 순수 전체 높이 요구량을 도출합니다.
  function getContentHeight() {
    return getSheetChromeHeight() + getBodyContentHeight() + 8;
  }

  // 바텀 시트가 화면에 컴포넌트로 최초 마운트되어 등장하는 찰나에 가져야 할 최적의 초기 시작 높이를 스냅 모드 조건별로 연산합니다.
  function getInitialHeight() {
    const viewportHeight = getViewportHeight();
    if (props.initialSnap === "full") return viewportHeight * props.maxRatio; // 최대 확장 스냅 모드로 진입 시 상한선 비율 높이 즉시 리턴
    if (props.initialSnap === "half") {
      return viewportHeight * BOTTOM_SHEET_SNAP_RATIO.half; // 절반 스냅 모드로 설정 시 규격화된 절반 비율(0.5) 리턴
    }

    const minimumSheetHeight = getMinimumSheetHeight(); // 최소 마지노선 높이 수치 확보
    const contentHeight = getContentHeight(); // 데이터 콘텐츠 실제 총 요구 높이 확보
    const contentSnapRatio = BOTTOM_SHEET_SNAP_RATIO.contentDefault; // 기본 콘텐츠 디폴트 높이 배율 로드

    // 콘텐츠 실제 요구량과 가용 가시 화면 한계치(뷰포트 * contentSnapRatio) 중 작은 값을 고르되, 그것이 최소 시트 보장 높이보다는 큼을 보장하도록 수학적 하이-로우 필터링 처리
    return Math.max(
      minimumSheetHeight,
      Math.min(contentHeight, viewportHeight * contentSnapRatio)
    );
  }

  // 바텀시트 연산 라이프사이클에 공유할 내부 팩토리 가동 함수 유틸팩 출격
  return {
    clampHeight,
    getInitialHeight,
    getMinimumSheetHeight,
    getViewportHeight,
    isMobileViewport,
  };
}

/**
 * @description 바텀시트가 열려 있는 동안 viewport 변화를 감시하는 리스너를 관리합니다.
 * @param {Function} scheduleViewportRefresh - viewport 변경 시 실행할 예약 함수입니다.
 * @returns {object} register/unregister 함수입니다.
 */
export function createBottomSheetViewportListeners(scheduleViewportRefresh) {
  let stopWindowEvents = []; // 윈도우 스코프 이벤트를 제거할 클로저 함수들을 가두는 수거 배열
  let stopVisualViewportResize = null; // 모바일 상단 비주얼 뷰포트 리사이즈 감시 해제 핸들러
  let stopVisualViewportScroll = null; // 모바일 비주얼 뷰포트 스크롤 감시 해제 핸들러

  // 바텀 시트가 팝업되어 화면에 안착하는 순간 윈도우 및 모바일 모던 하드웨어 API단에 뷰포트 교란 감시 리스너들을 연쇄 정밀 장착합니다.
  function registerViewportListeners() {
    if (stopWindowEvents.length) return; // 중복 바인딩 및 이벤트 누수 방어 가드

    // 공통 상수 리스트(resize, orientationchange 등)를 맵핑하며 전역 윈도우 버스 리스너 개통 가동
    stopWindowEvents = BOTTOM_SHEET_REFRESH_EVENTS.map((eventName) =>
      useEventListener(window, eventName, scheduleViewportRefresh, {
        passive: true, // 터치/스크롤 요동 시 유연한 프레임 확보를 위해 최적화 패시브 옵션 체결
      })
    );

    // 모던 모바일 브라우저 표준: 가상 키보드가 영문/한글 팝업되어 화면을 수시로 쥐어짜는 국면을 완벽히 하이재킹하기 위해 네이티브 `visualViewport` 인터페이스 감시 바인딩 추가
    if (window.visualViewport) {
      stopVisualViewportResize = useEventListener(
        window.visualViewport,
        "resize",
        scheduleViewportRefresh,
        {passive: true}
      );
      stopVisualViewportScroll = useEventListener(
        window.visualViewport,
        "scroll",
        scheduleViewportRefresh,
        {passive: true}
      );
    }
  }

  // 바텀시트가 닫히거나 컴포넌트가 파괴될 때 좀비 리스너가 리소스를 좀먹지 않도록 메모리 전격 수거 및 초기화 시퀀스를 수행합니다.
  function unregisterViewportListeners() {
    stopWindowEvents.forEach((stop) => stop?.()); // 전역 윈도우 이벤트 감시 채널 전부 폭파 폐쇄
    stopVisualViewportResize?.(); // 비주얼 뷰포트 추적 가드 철거
    stopVisualViewportScroll?.();
    stopWindowEvents = []; // 가비지 컬렉터 대상 인입 명세 초기화
    stopVisualViewportResize = null;
    stopVisualViewportScroll = null;
  }

  return {
    registerViewportListeners,
    unregisterViewportListeners,
  };
}

/**
 * @description viewport 새로고침 타이머를 기존 지연 시간과 동일하게 관리합니다.
 * @param {object} options - 예약 실행에 필요한 상태입니다.
 * @param {object} options.props - 바텀시트 props입니다.
 * @param {import('vue').Ref<number>} options.currentHeight - 현재 높이 ref입니다.
 * @param {import('vue').Ref<string>} options.currentSnap - 현재 snap ref입니다.
 * @param {Function} options.setHeight - 높이 적용 함수입니다.
 * @returns {object} schedule/clear 함수입니다.
 */
export function createBottomSheetViewportScheduler(options) {
  const {props, currentHeight, currentSnap, setHeight} = options;
  let viewportTimer = null; // 디바운스 및 디레이 처리를 제어할 타이머 고유 식별 핸들
  let viewportFrame = null; // 브라우저 주사율 렌더 스레드에 결합할 애니메이션 프레임 고유 식별 핸들

  // 스케줄러 버스 큐를 경유해 최종 수립된 타이밍 경계면에서 실제 바텀시트 높이 최신화 렌더 엔진 함수를 디스패치 호출합니다.
  function applyViewportRefresh() {
    if (!props.open) return; // 시트가 닫히는 과정이거나 비활성 상태인 경우 연산 가동 전면 거부
    setHeight(currentHeight.value, currentSnap.value); // 현재 적체되어 있던 픽셀 높이와 스냅 상태 명세를 가우징 타깃으로 투영
  }

  // [중요 가드 - 레이스 컨디션 및 연산 과부하 스래싱 방어]: 모바일 가상 키보드가 지연 동작을 하며 리사이즈 이벤트를 짧은 수 밀리초(ms) 사이에 수백 번 난사할 때,
  // 불필요한 브라우저 리플로우(Reflow) 연산 버스트를 차단하기 위해 RequestAnimationFrame과 setTimeout 타이머 큐를 이중 결합하여 프레임 레이트를 압축 디바운싱 조율합니다.
  function scheduleViewportRefresh() {
    window.clearTimeout(viewportTimer); // 기예약된 대기열 타이머 버스 전격 취소 리셋
    if (viewportFrame !== null) window.cancelAnimationFrame(viewportFrame); // 애니메이션 프레임 큐 청소 리셋

    // 1단계 가드: 브라우저 드로잉 렌더 스레드가 처리할 수 있는 프레임 경계면에 리프레시 타스크 예약 정렬
    if (window.requestAnimationFrame) {
      viewportFrame = window.requestAnimationFrame(() => {
        viewportFrame = null;
        applyViewportRefresh();
      });
    }

    // 2단계 가드: 안드로이드 인앱 웹뷰 등 가상 키보드가 물리적 뷰포트를 최종 완수 압축 전환하는 레이턴시 시간폭(BOTTOM_SHEET_VIEWPORT_REFRESH_DELAY_MS = 80ms)을 대기 유도하는 타이머 2중 안전 장치 연동
    viewportTimer = window.setTimeout(
      applyViewportRefresh,
      BOTTOM_SHEET_VIEWPORT_REFRESH_DELAY_MS
    );
  }

  // 잔존 대기열 타스크들을 강제 소멸 수거하여 타이머 인터벌 발산 현상을 방지합니다.
  function clearViewportRefresh() {
    window.clearTimeout(viewportTimer);
    viewportTimer = null;
    if (viewportFrame !== null) window.cancelAnimationFrame?.(viewportFrame);
    viewportFrame = null;
  }

  return {
    clearViewportRefresh,
    scheduleViewportRefresh,
  };
}
