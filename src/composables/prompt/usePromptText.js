/**
 * @file composables/prompt/usePromptText.js
 * @description 프롬프트 입력 도메인 composable입니다. 텍스트/첨부/도구/모델 선택 상태와 submit emit을 관리합니다.
 *
 * 프리징 코드 주석 기준:
 * - 이 주석은 코드 추적을 돕기 위한 설명이며 런타임 동작을 변경하지 않습니다.
 * - 함수/상태가 다른 composable, store, component로 전달되는 경우 호출 방향을 먼저 확인하세요.
 */

import {computed, nextTick, ref} from "vue";
import {PROMPT_TEXTAREA_HEIGHT} from "@/constants/promptComposer";

/**
 * @function usePromptText
 * @description 채팅창 텍스트 입력 영역의 인풋 스트링 추적, 스크롤 없는 유동적 텍스트 박스 높이 연산(Auto-grow),
 * 클립보드 이미지/파일 붙여넣기 인터셉트 처리를 총괄하는 UI 코어 컴포저블입니다.
 * @param {Object} context - 상위 툴바 매니저 및 라우터 컨텍스트 인터페이스 세트
 * @param {Ref<boolean>} context.isMobileSheet - 현재 화면 뷰포트가 모바일 시트 모드로 기동 중인지 판별하는 동적 플래그
 * @param {Function} context.emit - 높이 변동, 포커스 등 실시간 DOM 이벤트를 부모 입력 컴포넌트 밖으로 송출하기 위한 에미터
 * @returns {Object} 템플릿 마크업 텍스트박스 인풋 폼에 바인딩할 반응형 변수, 엘리먼트 Refs 및 이벤트 가드 핸들러 팩
 */
export function usePromptText({emit}) {
  // 사용자가 타이핑 중인 인풋 텍스트 본문 문자열을 저장하는 메인 데이터 모델 (v-model="text")
  const text = ref("");

  // 하이-레벨 커스텀 컴포넌트(예: 원격 디자인 시스템 디자인 래퍼 컴포넌트)의 인스턴스를 바인딩할 추적 고리
  const textareaComponentRef = ref(null);

  // 레이아웃 스래싱(Layout Thrashing) 및 부모 컴포넌트의 불필요한 무한 리렌더링 연쇄 반응을 방어하기 위한 높이 캐시 저장소
  let lastHeight = 0;

  // 컴포넌트 인스턴스 내부에 박혀있는 실제 브라우저 원시 HTML5 엘리먼트(`HTMLTextAreaElement`)의 노출 주소를 계산 추려냅니다.
  const textareaRef = computed(() => {
    const exposed = textareaComponentRef.value;
    const candidate =
      exposed?.textareaRef?.value ||
      exposed?.textareaRef ||
      exposed?.$el ||
      null;

    return candidate && typeof candidate === "object" ? candidate : null;
  });

  // 현재 인풋 란에 단순 공백 문자열을 제외하고 실제 유의미한 유저 전송용 쿼리가 타이핑되어 채워져 있는지 판별하는 플래그
  const hasPromptText = computed(() => text.value.trim().length > 0);

  /**
   * @function resize
   * @description [돔 레이아웃 엔진 최적화 변환식] 입력된 글자 라인 수 및 개행 여부에 맞춰 텍스트박스 높이를
   * 상하 임계점(minHeight ~ maxHeight) 한도 내에서 완벽하게 유동적으로 밀고 당기는 핵심 리사이징 스케줄러입니다.
   */
  function resize() {
    const el = textareaRef.value;
    if (!el) return; // 사용자가 대화창 화면을 급격히 이탈하여 대상 돔 엘리먼트가 언마운트된 경우 가드 탈출

    // ⚡ [오토-그로우 스크롤 스왑 메커니즘의 정석]
    // 엘리먼트의 height 값을 일시적으로 'auto'로 초기화 축소시켜야만,
    // 글자가 도중에 지워졌을 때(BackSpace 연타) 축소되어야 할 실제 컨텐츠 래핑 높이(scrollHeight)를 브라우저가 오차 없이 재측정할 수 있습니다.
    el.style.height = "auto";

    // maxRows 설정값이 실제 textarea 표시 줄 수의 단일 기준이 되도록 계산합니다.
    // 기존 mobileMax/desktopMax 고정 상한을 함께 Math.max로 비교하면 maxRows를 2, 3으로 줄여도
    // 136px/160px 상한이 계속 우선되어 설정값이 의미 없어지는 문제가 발생합니다.
    const computedStyle = window.getComputedStyle(el);
    const lineHeight = Number.parseFloat(computedStyle.lineHeight);
    const paddingTop = Number.parseFloat(computedStyle.paddingTop) || 0;
    const paddingBottom = Number.parseFloat(computedStyle.paddingBottom) || 0;
    const borderTop = Number.parseFloat(computedStyle.borderTopWidth) || 0;
    const borderBottom =
      Number.parseFloat(computedStyle.borderBottomWidth) || 0;
    const resolvedLineHeight = Number.isFinite(lineHeight)
      ? lineHeight
      : PROMPT_TEXTAREA_HEIGHT.lineHeight;
    const resolvedMaxRows = Math.max(
      Number.parseInt(PROMPT_TEXTAREA_HEIGHT.maxRows, 10) || 1,
      1
    );
    const maxHeight =
      resolvedLineHeight * resolvedMaxRows +
      paddingTop +
      paddingBottom +
      borderTop +
      borderBottom;

    // 전역 CSS에 남아있는 max-height: 136px/160px/180px 규칙보다 maxRows 계산값이 우선되도록
    // inline max-height도 같은 값으로 동기화합니다.
    el.style.maxHeight = `${maxHeight}px`;

    // 측정 완료된 돔의 물리 내용물 총 높이(scrollHeight)를 기반으로 최소 규격과 최대 임계 사양을 안전하게 한정 매핑합니다.
    const nextHeight = Math.min(
      Math.max(el.scrollHeight, PROMPT_TEXTAREA_HEIGHT.min),
      maxHeight
    );

    // 연산 완료된 최종 물리 픽셀 치수를 돔 스타일에 강제 수립 반영합니다.
    el.style.height = `${nextHeight}px`;

    // 텍스트 내용이 최대 허용 지정 임계치를 돌파한 시점에만 내부에 세로 스크롤바(`auto`)를 활성화하고, 그 외에는 스크롤바를 강제 암전 소멸(`hidden`) 처리합니다.
    el.style.overflowY = el.scrollHeight > maxHeight ? "auto" : "hidden";

    // [최적화 가드 락] 연산된 높이가 직전 프레임 프레임 수치와 실질적인 차이가 있을 때만 최종 변경 이벤트를 송출합니다.
    // 이를 통해 미세 마이크로 픽셀 단위 연산 오차로 인한 무한 리플로우 루프 현상을 완벽히 차단 방어합니다.
    if (nextHeight !== lastHeight) {
      lastHeight = nextHeight;
      emit("height-change", nextHeight); // 바깥 레이아웃(채팅 리스트 컴포넌트 뷰포트 마진) 높이 동시 대응 전파
    }
  }

  /**
   * 유저가 입력창을 클릭하거나 탭 키로 포커스를 진입시켰을 때 작동하는 인터셉터입니다.
   */
  function handleFocus() {
    emit("focus");
    // 가상 키보드가 팝업되며 인풋 영역을 밀어 올리는 브라우저의 렌더링 틱을 기다린 후, 찌그러진 텍스트창 높이를 안전하게 재조율 보정합니다.
    nextTick(resize);
  }

  /**
   * @function handlePaste
   * @description [고급 UX 확장 파이프라인] 유저가 컴퓨터 화면을 캡처한 후 입력창에 `Ctrl + V` 또는
   * 파일 복사 붙여넣기를 수행했을 때, 텍스트 스트링 주소 대신 '바이너리 파일 스트림' 데이터 세트를 가로채 추출합니다.
   * @param {ClipboardEvent} event - 브라우저 네이티브 클립보드 패킷 데이터 소스
   * @returns {Array<File>|undefined} 클립보드 내부에 실재하는 물리 파일 어레이 목록 (텍스트 붙여넣기 시엔 통과 탈출)
   */
  function handlePaste(event) {
    const files = Array.from(event.clipboardData?.files || []);
    if (!files.length) return; // 파일 데이터가 아닌 순수 텍스트 붙여넣기 트랜잭션인 경우 브라우저 표준 타이핑 입력 라인으로 통과 바이패스 시킵니다.

    return files; // 파일 객체 배열을 상위 훅 매니저(`usePromptAttachment`) 레이어로 가로채어 토스 전달합니다.
  }

  /**
   * 외부 조율 레이어가 현재 확정 유지 중인 텍스트박스의 실시간 물리 높이 정보를 스캔할 수 있도록 게터 메서드를 오픈합니다.
   */
  function getLastHeight() {
    return lastHeight;
  }

  /**
   * 팝업 창을 닫거나 파일 첨부를 마친 뒤, 사용자 타이핑 연속성 유지를 위해 인풋 커서(Focus)를 강제로 복원 점등시킵니다.
   */
  function focusTextarea() {
    textareaRef.value?.focus();
  }

  // 인풋 마크업 뷰 바인딩 및 파일 가레채기 연동 모듈 전달용 마스터 버스 인터페이스 노출
  return {
    text,
    textareaComponentRef,
    textareaRef,
    hasPromptText,
    resize,
    handleFocus,
    handlePaste,
    getLastHeight,
    focusTextarea,
  };
}
