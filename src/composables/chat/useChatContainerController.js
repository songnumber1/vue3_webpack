/**
 * @file composables/chat/useChatContainerController.js
 * @description 채팅 도메인 composable입니다. 질문 전송, 메시지 동기화, SSE 결과 반영, scroll/overlay action을 담당합니다.
 *
 * 프리징 코드 주석 기준:
 * - 이 주석은 코드 추적을 돕기 위한 설명이며 런타임 동작을 변경하지 않습니다.
 * - 함수/상태가 다른 composable, store, component로 전달되는 경우 호출 방향을 먼저 확인하세요.
 */

import {computed, onBeforeUnmount, ref, watch} from "vue";
import {useRoute} from "vue-router";
import {useChatRuntime} from "@/composables/chat/useChatRuntime";
import {useChatDataController} from "@/composables/chat/container/useChatDataController";
import {useChatUIController} from "@/composables/chat/container/useChatUIController";

/**
 * [ChatContainer 최상위 controller]
 * runtime/store, UI state, route data, submit/SSE 흐름을 하나로 조립합니다.
 * 하위 composable이 많기 때문에 여기서는 '어떤 도메인을 연결하는지'만 보고,
 * 실제 상태 변경은 useChatUIController/useChatDataController/useChatRuntime에서 추적하는 것이 좋습니다.
 */

/**
 * @function useChatContainerController
 * @description 채팅 메인 화면의 상위 비즈니스 로직, UI 인터랙션 및 상태 제어 모델을 하나로 통합하여 조율하는 마스터 컨트롤러 훅입니다.
 * 내부적으로 데이터 전용 컨트롤러(`data`)와 UI 전용 컨트롤러(`ui`)를 생성하고 생명주기를 동기화합니다.
 * @param {Object} props - 상위 부모 뷰 컴포넌트로부터 전달받은 반응형 Props 객체
 * @param {string} props.mode - 현재 페이지의 진입 유형 모드 (`"main"`, `"chat"`, `"shared"`)
 * @returns {Object} 템플릿(UI View)에서 다이렉트로 바인딩하여 사용할 수 있도록 완전히 가공된 상태 플래그 및 메서드 모음집
 * @see {@link useChatRuntime} 채팅 코어 엔진 런타임 제어 훅
 * @see {@link useChatDataController} API 호출 및 메시지 데이터 동기화를 전담하는 데이터 제어 컨트롤러 훅
 * @see {@link useChatUIController} 스크롤, 다이얼로그 모달, 서랍 메뉴 등 레이아웃 인터랙션을 전담하는 UI 제어 컨트롤러 훅
 */
export function useChatContainerController(props) {
  // 1. 현재 주소창의 파라미터(id, shareId 등)를 읽어오기 위해 Vue Router 라우트 객체를 인스턴스화합니다.
  const route = useRoute();

  // 2. 글로벌 채팅 엔진의 상태 및 다국어 인스턴스에 접근하기 위해 공통 런타임 객체를 로드합니다.
  const runtime = useChatRuntime();

  // 3. 화면에 실시간으로 표시될 반응형 대화 메시지 목록 배열 데이터를 생성합니다.
  const messages = ref([]);

  // 4. 컴포넌트가 주입받은 props 내의 실행 모드 속성(mode)을 추적하기 위해 계산된 속성(computed)으로 감쌉니다.
  const currentMode = computed(() => props.mode);

  // 5. 현재 사용자가 보고 있는 화면의 상태 유형을 세분화하여 다양한 Boolean 플래그 셋으로 관리하는 컨텍스트 객체입니다.
  const pageState = {
    currentMode,
    // 대화 이력이 없는 완전히 깨끗한 첫 메인 홈 화면인지 판단합니다.
    isMainPage: computed(() => currentMode.value === "main"),
    // 기존에 진행 중이던 특정 대화방 화면 내부인지 판단합니다.
    isChatPage: computed(() => currentMode.value === "chat"),
    // 타인이 보낸 링크를 타고 들어온 공유된 대화 페이지 화면인지 판단합니다.
    isSharedPage: computed(() => currentMode.value === "shared"),
    // 메인 홈 화면을 제외한, 모든 형태의 '실질적 대화 컨텍스트가 존재하는 화면'인지 통합 판단합니다.
    isConversationPage: computed(
      () => currentMode.value === "chat" || currentMode.value === "shared"
    ),
    // 공유 페이지와 같이 사용자가 추가적인 대화 전송을 할 수 없는 읽기 전용 상태 화면인지 판단합니다.
    isReadOnly: computed(() => currentMode.value === "shared"),
  };

  /**
   * 진입 유형(모드)에 따라 현재 활성화된 대화방의 고유 ID 식별자를 동적으로 추적합니다.
   * @type {import("vue").ComputedRef<string|null>}
   */
  const activeHistoryId = computed(() => {
    // 현재 진행형 대화방 모드라면 URL 파라미터 경로의 :id 값을 반환합니다.
    if (pageState.isChatPage.value) return route.params.id;
    // 단순 공유 페이지 뷰어 모드라면 URL 파라미터 경로의 :shareId 값을 반환합니다.
    if (pageState.isSharedPage.value) return route.params.shareId;
    // 어떤 조건도 맞지 않는 메인 홈이라면 활성화된 이력 ID가 없으므로 null을 반환합니다.
    return null;
  });

  // 6. 스크롤, 레이아웃 바인딩, 모달 상태 등 순수 UI 인터랙션 로직이 담긴 전용 컨트롤러 인스턴스를 빌드합니다.
  const ui = useChatUIController({
    messages, // 실시간 렌더링에 참조할 메시지 반응형 참조 배열 전달
    runtime, // 다국어 번역 및 공통 데이터 획득용 런타임 인스턴스 주입
    pageState, // 현재 화면의 상태 정보 플래그 셋 공유
    activeHistoryId, // 감지된 활성화 이력 ID 주입
  });

  // 7. API 송수신, 백엔드 동기화, 어시스턴트 모델 정보 제어 등 순수 데이터 파이프라인 로직이 담긴 전용 컨트롤러 인스턴스를 빌드합니다.
  const data = useChatDataController({props, ui, runtime, messages});

  // 8. 데이터 레이어 상 메인 페이지 여부가 변경될 때마다 모바일 전용 UI 상태(예: 모바일 전용 레프트 드로어 닫기 등)를 연동 동기화합니다.
  watch(data.isMainPage, ui.updateMobileState);

  // 9. 현재 화면이 대화방 컨텍스트 상태인지 여부가 바뀔 때도 모바일 타깃 레이아웃 상태를 실시간 보정 업데이트합니다.
  watch(() => data.isConversationPage.value, ui.updateMobileState);

  // 10. UI 컨트롤러 내부에 정의된 각종 윈도우 스크롤 감지 리스너 및 뷰포트 바인딩 이벤트를 전역 가동합니다.
  ui.bindUiEvents();

  // 11. 데이터 컨트롤러 내부에 정의된 전역 SSE 스트리밍 수신 대기 및 에러 리스너 인터페이스를 결합합니다.
  data.bindDataEvents();

  // 12. 현재 진입 조건(activeHistoryId 등)에 따라 기존 대화 이력을 가져오거나 기본 어시스턴트 목록을 로드하는 초기화 작업을 기동합니다.
  data.initializeDataController();

  // 13. 컴포넌트가 소멸(언마운트)되기 직전에 자원 낭비 및 메모리 누수를 막기 위해 UI 가동 리스너들을 정리(Cleanup)합니다.
  onBeforeUnmount(() => {
    ui.cleanupUiController();
  });

  // 14. ChatContainer 템플릿에서 바로 구조분해해 쓰도록 data/ui 컨트롤러를 평탄화해 반환합니다.
  // 기존처럼 각 속성을 한 줄씩 다시 포워딩하지 않고, 실제 상태 소유자인 하위 컨트롤러 객체를 그대로 노출해
  // wrapper 레벨과 유지보수 부담을 줄입니다.
  return {
    ...data,
    ...ui,
    // 동일한 이름이 생겨도 핵심 public alias는 명시적으로 고정합니다.
    t: ui.t,
    runtimeReady: data.runtimeReady,
    workspaceRef: ui.workspaceRef,
    messages: data.messages,
    submit: data.submit,
    regenerate: data.regenerate,
  };
}
