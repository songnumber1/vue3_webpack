/**
 * @file composables/chat/internal/container/useChatPromptActions.js
 * @description ChatContainer 전용 controller 계층입니다. route, UI 상태, scroll, modal, submit 흐름을 도메인별 composable로 조립합니다.
 *
 * 프리징 코드 주석 기준:
 * - 이 주석은 코드 추적을 돕기 위한 설명이며 런타임 동작을 변경하지 않습니다.
 * - 함수/상태가 다른 composable, store, component로 전달되는 경우 호출 방향을 먼저 확인하세요.
 */

/**
 * @typedef {object} ChatPromptActionsDependencies
 * @property {import('vue').Ref<boolean>} isReadOnly - 현재 채팅방이 아카이브되었거나 읽기 전용 모드 상태인지 여부를 나타내는 반응형 플래그
 * @property {import('vue').Ref<boolean>} isActiveModelUnavailable - 현재 낙점된 LLM AI 모델 서버가 점검 또는 만료되어 프롬프트 입력이 불가능한 상태인지 판별하는 플래그
 * @property {function(): void} [refreshViewport] - 모바일 가상 키보드가 올라올 때 웹뷰 가시 레이아웃 높이를 정밀 재연산해주는 플랫폼 뷰포트 동기화 함수
 */

/**
 * @description 입력창(Textarea)에 포커스가 잡히거나 사용자가 글자를 많이 입력하여 입력창 높이가 늘어날 때, 화면이 제멋대로 최하단으로 튕겨 내려가는 부작용을 격리 차단하고 오직 뷰포트 크기만 안전하게 갱신해주는 전용 훅입니다.
 * @param {ChatPromptActionsDependencies} dependencies - 다른 뷰포트 및 모델 제어 레이어에서 하향 주입받는 반응형 상태 및 메서드 묶음
 * @returns {{ refreshPromptViewport: () => void }} 프롬프트 입력 컴포넌트 내부의 `@focus` 또는 `@resize` 이벤트 버스에 직접 바인딩할 실행 인터페이스
 */
export function useChatPromptActions({
  isReadOnly,
  isActiveModelUnavailable,
  refreshViewport,
}) {
  /**
   * Prompt focus/resize should only refresh viewport geometry.
   *
   * Scroll ownership (스크롤 소유권 분할 정의):
   * - 질문 전송 시: useChatSubmit.scrollAfterUserSubmit()에서 마지막 사용자 질문 박스로 1회 이동
   * - 답변 수신 시: autoScrollOnAnswer=true일 때만 stream scroll
   *
   * 입력창 focus 또는 textarea resize에서 scrollBottom을 호출하면
   * 모바일 키보드 오픈/PC 모바일 사이즈에서 사용자가 의도하지 않았는데
   * 맨 아래로 이동하는 사이드 이펙트가 발생한다.
   */

  /**
   * @description 프롬프트 컴포넌트 내부 돔의 크기 변동 및 초점 활성화 신호를 하이재킹하여, 서비스 이용 불가능 상태가 아닐 때에만 브라우저 뷰포트 기하 연산을 안전하게 인보크합니다.
   * @returns {void}
   */
  function refreshPromptViewport() {
    // 멱등성 락앤가드: 읽기 전용 상태이거나 활성화된 AI 모델을 매핑할 수 없는 무효한 국면일 경우, 불필요한 레이아웃 리플로우(Reflow) 연산 버스트를 방지하기 위해 조기 탈출
    if (isReadOnly.value || isActiveModelUnavailable.value) return;

    // 플랫폼 뷰포트 갱신 팩토리가 정상 주입된 상태라면 가상 키보드 대응 수치 최신화 프로세스 전격 가동
    refreshViewport?.();
  }

  // 프롬프트 입력창 UI 컴포넌트 단바인딩용 파이프라인 인터페이스 방출 반환
  return {
    refreshPromptViewport,
  };
}
