import {computed} from "vue";
import {
  DEFAULT_FALLBACK_MODEL,
  PROMPT_MENU_TYPE,
} from "@/constants/promptComposer";
import {useChatStore} from "@/stores/chatStore";

/**
 * @function usePromptModel
 * @description 채팅 입력창 하단 툴바에서 AI 모델 목록(GPT, Claude 등)의 명세를 정렬하여 드로잉하고,
 * 유저가 새로운 모델을 선택했을 때 캐시 초기화 및 상태 변경을 에밋(Emit)하는 컴포저블입니다.
 * * @param {Object} context - 상위 컴포넌트 환경 및 툴바 통합 매니저로부터 전달받는 제어 인자 세트
 * @param {Object} context.props - 부모 뷰 컴포넌트가 하향 주입한 읽기 전용 상태 변수 팩 (models, modelValue 등)
 * @param {Ref<boolean>} context.modelMenuOpen - 모델 드롭다운/바텀시트 서랍의 실시간 개폐 상태 플래그 래퍼
 * @param {Function} context.syncViewportMode - 가상 키보드 가드 및 모바일 스크린 해상도를 즉시 갱신하는 보정 함수
 * @param {Function} context.toggleMenu - 메뉴바 레이어 오버레이 컴포넌트들을 상호 배제 형태로 개폐 제어하는 허브 함수
 * @param {Function} context.emit - 부모 템플릿의 v-model 양방향 바인딩을 갱신하기 위한 이벤트 송출기
 * * @returns {Object} 마크업 템플릿 및 자식 컴포넌트에 이식할 { currentModels, currentModel, openModelSelector, selectModel }
 */
export function usePromptModel({
  props,
  modelMenuOpen,
  syncViewportMode,
  toggleMenu,
  emit,
}) {
  // 전역 대화방 컨텍스트 및 설정 템플릿을 동기화하기 위한 Pinia 마스터 스토어 인입
  const chatStore = useChatStore();

  // ── [장애 방어 가드: 시스템 폴백 모델 세팅] ──────────────────
  // 네트워크 장애, API 응답 유실, 혹은 가용 모델이 전무한 초동 진입 단계에서
  // 입력창 전체가 먹통 크래시되는 현상을 원천 방어하기 위해 내장 대기 모델 팩을 연산 빌드합니다.
  const fallbackModels = computed(() => [
    {id: props.modelValue, ...DEFAULT_FALLBACK_MODEL},
  ]);

  // 부모로부터 정상 수임된 LLM 모델 배열이 비어있다면 즉시 안전 가드용 백업 모델 리스트로 스위칭 치환합니다.
  const currentModels = computed(() =>
    props.models.length ? props.models : fallbackModels.value
  );

  // 현재 유저가 최종 활성화하여 바인딩 중인 단일 AI 마스터 모델 레코드 객체를 매칭 탐색합니다.
  // 일치하는 ID가 유실되었다면 배열의 가장 첫 번째 원소를 안전지대로 간주해 폴백 바인딩합니다.
  const currentModel = computed(
    () =>
      currentModels.value.find((model) => model.id === props.modelValue) ||
      currentModels.value[0]
  );

  /**
   * @function openModelSelector
   * @description 유저가 입력창 좌하단의 AI 모델 칩 버튼을 클릭했을 때 드롭다운 서랍을 점등 트리거합니다.
   */
  function openModelSelector() {
    // 읽기 전용 모드(ReadOnly)이거나 전체 툴바 비활성화 잠금 상태인 경우 서랍 전개를 원천 가드 차단합니다.
    if (props.disabled || props.modelReadonly) return;

    // 모바일 팽창 및 가상 키보드 위치 밀림 현상을 방어하기 위해 뷰포트 물리 모드를 선행 동기화합니다.
    syncViewportMode();

    // 타깃 모델 메뉴 카테고리를 활성화 지시합니다 (기존에 열려있던 파일 첨부 등 타 메뉴는 상호 배제 원칙에 의해 자동 닫힘).
    toggleMenu(PROMPT_MENU_TYPE.model);
  }

  /**
   * @function selectModel
   * @description 드롭다운 아이템 또는 바텀시트 리스트 목록에서 특정 AI 모델을 터치 선택했을 때 구동되는 변경 확정 함수입니다.
   * @param {string} id - 새로이 선택된 AI 모델의 고유 식별 Key
   */
  function selectModel(id) {
    // [중요 비즈니스 로직] 기존 모델과 상이한 전혀 새로운 성격의 LLM 모델로 체인지하는 시점인 경우,
    // 이전 모델의 토큰 구조나 전용 파라미터 규격에 맞춰 임시 조립되어 있던 프롬프트 템플릿 캐시 버퍼를 깔끔하게 청소 초기화합니다.
    if (id !== props.modelValue) {
      chatStore.resetActivePromptTemplate();
    }

    // Vue 3의 표준 v-model 규격에 입각하여 부모 컴포넌트의 프리셋 가치를 업데이트 단번에 칩니다.
    emit("update:modelValue", id);

    // 변경 처리가 완료되었으므로 전개되어 있던 모델 선택용 모달 서랍 윈도우 레이어를 안전하게 닫아 플래그 리셋합니다.
    modelMenuOpen.value = false;
  }

  // 뷰 컴포넌트 템플릿 렌더링 영역으로 핵심 상태 및 이벤트 핸들러 최종 노출 반환
  return {
    currentModels,
    currentModel,
    openModelSelector,
    selectModel,
  };
}
