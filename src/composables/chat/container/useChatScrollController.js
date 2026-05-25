/**
 * @file composables/chat/container/useChatScrollController.js
 * @description ChatContainer 전용 controller 계층입니다. route, UI 상태, scroll, modal, submit 흐름을 도메인별 composable로 조립합니다.
 *
 * 프리징 코드 주석 기준:
 * - 이 주석은 코드 추적을 돕기 위한 설명이며 런타임 동작을 변경하지 않습니다.
 * - 함수/상태가 다른 composable, store, component로 전달되는 경우 호출 방향을 먼저 확인하세요.
 */

import {ref} from "vue";

/**
 * @typedef {object} ChatScrollControllerDependencies
 * @property {import('vue').Ref<boolean>} isConversationPage - 현재 사용자가 메인 홈이 아닌 실제 대화방 내부(/chat/:id)에 진입해 있는지 판별하는 플래그
 * @property {import('vue').Ref<object|null>} workspaceRef - 메인 채팅 워크스페이스 컴포넌트의 돔/인스턴스 레퍼런스 포인터
 * @property {function(object=): Promise<void>} scrollToBottom - 워크스페이스가 제공하는 네이티브 기본 최하단 스크롤 조작 함수
 * @property {import('vue').Ref<boolean>} [autoScrollEnabled={value: true}] - 사용자의 실시간 AI 답변 자동 스크롤 추적 기능 활성화/수동 잠금 상태 플래그
 */

/**
 * @description 대화창 타임라인의 실시간 돔 렌더링 주기에 발맞추어 자동 스크롤(Force Bottom Lock)을 유지하거나, 사용자가 의도적으로 스크롤을 올렸을 때(IsAtBottom False) 하단 이동 플로팅 버튼을 노출해주는 상태 조율 컨트롤러 훅입니다.
 * @param {ChatScrollControllerDependencies} dependencies - 다른 하부 레이아웃 및 뷰 바인딩단에서 주입해 준 스크롤 조작 필수 소스 팩
 * @returns {object} 스크롤 추적 상태 필드 및 최하단 갱신 메서드 묶음 패키지
 */
export function useChatScrollController({
  isConversationPage,
  workspaceRef,
  scrollToBottom,
  autoScrollEnabled = {value: true},
}) {
  // 사용자가 화면을 위로 올려 과거 메시지를 보는 중일 때 템플릿에 '맨 아래로 내려가기' 플로팅 버튼을 띄울지 여부 상태 플래그
  const showScrollBottom = ref(false);

  // 현재 스크롤 위치 점검 연산의 잦은 무브 오버헤드를 제어하기 위한 디바운스 타이머 식별 ID
  let bottomStateTimer = 0;
  // 타임스탬프(ms)를 기록하여, 특정 밀리초 동안은 브라우저 리렌더링 버스트가 일어나더라도 무조건 스크롤을 바닥에 고정(Lock-in)하기 위한 만료 시점 타이머
  let forceBottomUntil = 0;
  // 컴포넌트 마운트 레이턴시 및 마크다운 비동기 파싱 지연에 대응하기 위해 예약된 멀티 단계 타이머 핸들 수거 배열
  let latestUserScrollTimerIds = [];

  /**
   * @description 외부 워크스페이스 컴포넌트 내부에서 노출(`defineExpose`)해 준 메시지 리스트 템플릿의 스크롤 조작 메서드 인터페이스 객체를 동적으로 탐색 수색하여 포인터를 탈취합니다.
   * @returns {object|null} 활성화된 내부 가용 메시지 리스트 인터페이스
   */
  function getMessageListRef() {
    const exposed = workspaceRef.value?.listRef;

    // 구조 분기 1: 자식 노드에서 래핑 없이 다이렉트로 인터페이스를 노출해 준 경우 즉시 채택
    if (exposed?.scrollToBottom || exposed?.scrollToLatestUserMessage) {
      return exposed;
    }
    // 구조 분기 2: 자식 인스턴스가 Vue Ref(Ref<Ref<...>>) 형태로 2중 중첩 래핑되어 노출된 특이 국면 폴백 대응
    if (
      exposed?.value?.scrollToBottom ||
      exposed?.value?.scrollToLatestUserMessage
    ) {
      return exposed.value;
    }
    return null; // 아직 돔 마운트 전이거나 유효하지 않은 경우 안전 공백 처리
  }

  /**
   * @description 매개변수로 주입받은 특정 시간(기본값 1.8초) 동안은 AI가 수십 번 문장을 스트리밍하여 높이가 변동되더라도 강제로 스크롤 바닥 잠금 장치를 유지하도록 유효 타임스탬프 제한선을 록인 마킹합니다.
   * @param {number} [duration=1800] - 강제 하단 스크롤 락을 관철할 유지 목표 시간폭 (단위: 밀리초)
   */
  function markForceBottom(duration = 1800) {
    forceBottomUntil = Date.now() + duration;
  }

  /**
   * @description 예약되어 있던 하단 고정 잠금 스탬프를 초기화하여 원상 복귀합니다.
   */
  function clearForceBottom() {
    forceBottomUntil = 0;
  }

  /**
   * @description 비동기 렌더링 보정을 위해 스케줄러 큐에 예약 대기 중이던 좀비 타이머 핸들 채널들을 전부 파괴 수거하여 메모리 누수를 원천 봉쇄합니다.
   */
  function clearLatestUserScrollTimers() {
    latestUserScrollTimerIds.forEach((timerId) => window.clearTimeout(timerId));
    latestUserScrollTimerIds = [];
  }

  /**
   * @description 사용자가 설정 메뉴에서 자동 스크롤 기능을 꺼두지 않았고, 현재 시간축이 지정된 하단 고정 만료 타임스탬프 범위 안에서 숨쉬고 있는지 판별합니다.
   * @returns {boolean} 강제 바닥 고정 유지 필요 여부
   */
  function shouldKeepForceBottom() {
    return Boolean(autoScrollEnabled?.value) && Date.now() <= forceBottomUntil;
  }

  /**
   * @description 대화 타임라인 화면을 최하단 끝점 픽셀로 밀어내립니다. (자동 답변 상태에서 수동 스크롤 조작 개입 시 이를 존중하여 연산을 우회 회피하는 최적화 가드가 내장됨)
   * @param {object} [options={}] - 애니메이션 및 스무스 이동 관련 가이드 옵션 패킷
   * @param {boolean} [options.autoAnswer] - 이번 스크롤 명령이 AI 답변 패킷 스트리밍 수신에 의해 유발된 자동 제어인지 여부 플래그
   */
  async function scrollBottom(options = {}) {
    // 자동 스크롤 락 방어 가드: AI가 답변을 출력 중인데 사용자가 과거 내역을 위로 정주행 중이라 자동 추적 스위치를 잠시 꺼둔 경우라면 이동 명령을 거부하고 버튼 상태만 최신화
    if (options.autoAnswer && !autoScrollEnabled?.value) {
      updateScrollBottomButton();
      return;
    }

    const list = getMessageListRef();
    // 1순위: 리스트 전용 최적화 가상 스크롤 인프라가 갖춰진 경우 해당 고성능 메서드 인보크 호출
    if (list?.scrollToBottom) {
      list.scrollToBottom(options);
    } else {
      // 2순위: 아직 초기 마운트 국면이거나 정적 스크롤 영역인 경우 부모 헬퍼 단의 범용 메서드로 폴백 구동
      await scrollToBottom(options);
    }
    updateScrollBottomButton(); // 조작 완수 후 팝업 버튼 가시성 최신 동기화
  }

  /**
   * @description 사용자가 질문을 전송한 직후, 자신이 타이핑했던 '방금 그 마지막 질문 박스' 위치로 시선을 낚아채어 이동해주는 특수 앵커 스크롤 함수입니다.
   * 이미지 로딩이나 마크다운 컴포넌트 비동기 마운트로 인해 화면 길이가 뒤늦게 늘어나는 웹 인터랙션 한계를 깨부수기 위해 5단계 점진적 백오프 배정 타이머(0ms~320ms) 큐를 연속 가동합니다.
   * @param {object} [options={}] - 스크롤 커스텀 매개 옵션
   */
  async function scrollLatestUserMessage(options = {}) {
    clearLatestUserScrollTimers(); // 기존에 잔존하던 이전 회차 백오프 타이머 예약 대기열 일괄 폭파 청소

    // 내부 타겟팅 엑츄에이터 클로저 정의
    const apply = () => {
      const list = getMessageListRef();
      if (!list?.scrollToLatestUserMessage) return false; // 아직 자식 돔 컴포넌트가 마운트되지 않은 경우 무효 처리 플래그 반환

      list.scrollToLatestUserMessage({
        stable: true, // 레이아웃 흔들림 현상을 제어하기 위한 스테이블 연산 모드 체결
        ...options,
      });
      updateScrollBottomButton();
      return true; // 정상 추적 완수 마킹 반환
    };

    // 1회차 즉시 실행 시도: 만약 레이아웃 돔이 이미 완성되어 성공했다면 하위 백오프 타이머 큐를 굳이 가동하지 않고 조기 종결 탈출
    if (apply()) return;

    // 2회차 안전 보정 가드 큐: 0ms(마이크로태스크 다음 프레임), 32ms, 80ms, 160ms, 320ms의 정밀 시차 시차 간격을 두고 돔 구조 변화를 끝까지 추적하며 끈질기게 최신 유저 메시지 박스를 시야각 내로 앵커링 조작
    [0, 32, 80, 160, 320].forEach((delay) => {
      const timerId = window.setTimeout(apply, delay);
      latestUserScrollTimerIds.push(timerId); // 컴포넌트 언마운트 시 일괄 청소를 위해 버스 배열에 티켓 적재
    });
  }

  /**
   * @description 자식 컴포넌트의 네이티브 상태 값(`list.isAtBottom`)을 실시간 해독하여, 실제 스크롤바가 최하단 바닥면에 완전히 붙어 있지 않은 조작 공백 국면일 때에만 하단 이동 버튼을 노출 상태(`true`)로 전환합니다.
   */
  function updateScrollBottomButton() {
    const list = getMessageListRef();
    showScrollBottom.value =
      Boolean(isConversationPage?.value) && // 조건 1: 반드시 아카이브 홈이 아닌 실제 활성 대화방 페이지 내부에 위치해야 함
      Boolean(list && !list.isAtBottom?.()); // 조건 2: 돔 수색이 완료되었고, 그 돔이 바닥 끝점이 아닌 상단 어딘가에 체류 중이어야 함
  }

  /**
   * @description 마우스 휠 요동이나 터치 무브 이벤트 발생 시 연산 과부하 및 프레임 튐을 차단하기 위해 80ms 타임 아웃 디바운싱을 거쳐 하단 이동 버튼 가시성을 부드럽게 점등 검증합니다.
   */
  function scheduleBottomStateCheck() {
    window.clearTimeout(bottomStateTimer);
    bottomStateTimer = window.setTimeout(updateScrollBottomButton, 80);
  }

  /**
   * @description AI 답변 텍스트 마크다운 컴포넌트 내부나 외부 메타 정보 레이어가 실시간으로 브라우저에 화면을 그리며 정착을 완수했을 때(`Rendered`) 전달받는 내부 하이재킹 콜백 핸들러입니다.
   */
  function handleMessageContentRendered() {
    // 만약 사용자가 강제 바닥 잠금 세션 시간대(forceBottomUntil) 내에 머물러 있다면 데이터 가변 청크 길이에 맞춰 스크롤 바를 자석처럼 전격 동기화 강제 하향 이동
    if (shouldKeepForceBottom())
      scrollBottom({force: true, stable: true, autoAnswer: true});

    scheduleBottomStateCheck(); // 이동 처리 완료 후 스크롤 상태 최종 재진단 디스패치
  }

  /**
   * @description 컴포넌트가 파괴되거나 사용자가 방을 이탈하는 마지막 찰나에 가동 중이던 모든 백오프 타이머와 스케줄러 큐를 원천 폐쇄 수거하여 전역 자원 누수를 종결 차단합니다.
   */
  function cleanupScrollController() {
    window.clearTimeout(bottomStateTimer);
    clearLatestUserScrollTimers();
  }

  // 최상위 ChatContainer 컨트롤러 및 우측 하단 플로팅 버튼 컴포넌트 단바인딩용 제어 인터페이스 레버 배출 반환
  return {
    showScrollBottom,
    markForceBottom,
    clearForceBottom,
    scrollBottom,
    scrollLatestUserMessage,
    scheduleBottomStateCheck,
    handleMessageContentRendered,
    cleanupScrollController,
  };
}
