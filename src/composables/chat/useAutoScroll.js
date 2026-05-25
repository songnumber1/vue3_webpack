import {nextTick} from "vue";

/**
 * @function afterFrame
 * @description [브라우저 하드웨어 동기화 헬퍼] 가상 돔 변경 후 브라우저가 레이아웃을 계산(Reflow)하고
 * 화면을 실제로 그리는(Repaint) 타이밍의 안전한 최외각 마감 단락을 확보하기 위해 'Double RAF' 패턴을 구동합니다.
 * @param {Function} callback - 뷰포트 물리 스크롤 연산 등 최종 페인팅 완료 직후 집행할 콜백 함수
 */
function afterFrame(callback) {
  // SSR(서버 사이드 렌더링) 환경이거나 구형 브라우저 등 RAF API를 지원하지 않는 환경인 경우 비동기 매크로태스크(setTimeout)로 안전하게 폴백합니다.
  if (
    typeof window === "undefined" ||
    typeof window.requestAnimationFrame !== "function"
  ) {
    setTimeout(callback, 0);
    return;
  }

  // [Double requestAnimationFrame 아키텍처 플로우]
  // 1st RAF: 현재 프레임에서 발생한 데이터 바인딩 및 가상 돔 브라우저 렌더링 대기열을 예약 수렴합니다.
  window.requestAnimationFrame(() => {
    // 2nd RAF: 브라우저가 화면 드로잉(Paint)을 1회 완벽하게 마친 직후인 '다음 프레임의 시작점'에 콜백을 큐잉합니다.
    // 이를 통해 엘리먼트 팽창(메시지 글자 추가 등)이 완벽히 끝난 시점의 실제 돔 높이(scrollHeight)를 오차 없이 측정할 수 있게 됩니다.
    window.requestAnimationFrame(callback);
  });
}

/**
 * @function useAutoScroll
 * @description 채팅창 컴포넌트 내부에서 AI 말풍선 증가, 유저 전송 등으로 스크롤 바를 강제 하향 이동시켜야 할 때,
 * 엘리먼트 컴포넌트의 노출 레퍼런스를 참조하여 안전하게 하단 정렬을 집행하는 범용 스크롤 스케줄러 컴포저블입니다.
 * @param {Ref<HTMLElement|Component|null>} targetRef - 가상 돔 <div ref="workspaceRef"> 또는 자식 컴포넌트 인스턴스 고리
 * @returns {Object} 템플릿 제어 레이어가 즉시 호출 가능한 { scrollToBottom } 비동기 메서드 버스 팩
 */
export function useAutoScroll(targetRef) {
  /**
   * @function scrollToBottom
   * @description 외부 스트리밍 파이프라인(`useChatSubmit`) 또는 UI 컨트롤러가 실시간 토큰 인입 시점마다 무한 연사 호출하는 물리 스크롤 제어 함수입니다.
   * @param {Object} [options={}] - 스크롤 애니메이션 형태 및 가이드 속성 팩 (예: behavior: "smooth" | "auto")
   */
  async function scrollToBottom(options = {}) {
    // 1단계: Vue 3 자체 반응형 데이터 상태가 가상 돔(Virtual DOM) 버퍼에 완벽히 반영될 때까지 마이크로태스크 레벨에서 1차 대기합니다.
    await nextTick();

    // 2단계: 하드웨어 디스플레이 주사율 동기화 큐(afterFrame) 내부로 제어권을 넘겨 돔 픽셀 연산 레이아웃이 찢어지는 현상을 방어합니다.
    afterFrame(() => {
      const target = targetRef.value;
      if (!target) return; // 사용자가 대화방 탭을 급격히 이탈하여 대상 돔 엘리먼트가 언마운트(소멸)된 상태라면 하위 연산을 가드 차단합니다.

      // 디자인 시스템 하위 하이-레벨 가상 스크롤 컴포넌트이거나 자체 커스텀 스크롤 메서드가 인터페이스로 노출되어 있다면 다이렉트 트리거합니다.
      if (typeof target.scrollToBottom === "function") {
        target.scrollToBottom(options);
      }
    });
  }

  return {scrollToBottom};
}
