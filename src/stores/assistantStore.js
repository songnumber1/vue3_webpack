import {defineStore} from "pinia";

/**
 * @description 워크스페이스 내 어시스턴트 페르소나 목록과 매핑된 LLM AI 모델 풀의 상태 관리를 전담하는 스토어입니다.
 */
export const useAssistantStore = defineStore("assistant", {
  // 실시간 구독 가능한 마스터 인프라 상태 명세
  state: () => ({
    assistants: [], // 원격지에서 수임된 전체 어시스턴트 레코드 어레이
    assistantMap: {}, // 빠른 탐색을 위한 고유 ID 기반 어시스턴트 해시 맵
    models: [], // 현재 가용한 일반 AI 마스터 모델 리스트
    allModels: [], // 백업 사양을 포함한 전체 원시 LLM 사양 목록
    modelMap: {}, // 고유 식별 Key 기반 AI 모델 해시 맵
    modelMapByAssistant: {}, // 어시스턴트 식별자별로 가용 모델 군을 묶어둔 이중 맵 구조체
    selectedAssistantId: "", // 사용자가 최종 터치하여 활성화한 어시스턴트 마스터 ID
    selectedModelId: "", // 현재 활성 대화 트랙에 할당된 타깃 LLM ID
    examplePromptMap: {}, // 초동 진입 시 노출할 어시스턴트 전용 추천 프롬프트 세트
    promptTemplates: [], // 확장 툴바와 결합할 목적 기반 시스템 프롬프트 프리셋
  }),
  getters: {
    /**
     * 현재 사용자가 최종 활성화하여 바인딩 중인 단일 어시스턴트 마스터 레코드 객체를 탐색 게팅합니다.
     */
    currentAssistant: (state) =>
      state.assistantMap[state.selectedAssistantId] ||
      state.assistants[0] ||
      null,
    /**
     * 현재 선택된 어시스턴트 페르소나가 내부 구조적으로 호환 운용 가능한 LLM 모델 세트 목록을 동적 추출합니다.
     */
    currentModels: (state) =>
      state.modelMapByAssistant[state.selectedAssistantId] || [],
    /**
     * 사용자가 대화창 인풋 단에 최종 마운팅한 단일 AI 마스터 모델 레코드 스냅샷을 추출합니다.
     */
    currentModel: (state) => state.modelMap[state.selectedModelId] || null,
  },
  actions: {
    /**
     * @function setBootstrapData
     * @description 최초 화면 진입 단계에서 인프라 마스터 응답 API 스냅샷을 스토어 데이터 구조에 일괄 주입 동기화합니다.
     * @param {object} payload - 마스터 부트스트랩 데이터 세트 오브젝트
     */
    setBootstrapData(payload = {}) {
      this.assistants = payload.assistants || [];
      this.assistantMap = payload.assistantMap || {};
      this.models = payload.models || [];
      this.allModels = payload.allModels || payload.models || [];
      this.modelMap = payload.modelMap || {};
      this.modelMapByAssistant = payload.modelMapByAssistant || {};
      // 초기 선택값 수립 (전달받은 지정값이 없다면 배열 최선두 원소를 폴백으로 조율)
      this.selectedAssistantId =
        payload.initialAssistantId || this.assistants[0]?.id || "";
      this.selectedModelId =
        payload.initialModelId || this.currentModels[0]?.id || "";
      this.examplePromptMap = payload.examplePromptMap || {};
      this.promptTemplates = payload.promptTemplates || [];
    },
    /**
     * @function selectAssistant
     * @description 유저가 사이드바 등에서 어시스턴트 페르소나를 교체했을 때 구동되는 핸들러입니다.
     * @param {string} id - 새로 선택된 타깃 어시스턴트 ID
     */
    selectAssistant(id) {
      if (!this.assistantMap[id]) return; // 존재하지 않는 섀도우 키 인입 시 철저 가드
      this.selectedAssistantId = id; // 활성 어시스턴트 식별자 최신화

      const models = this.modelMapByAssistant[id] || [];
      // [종속성 교정 가드] 바뀐 어시스턴트가 기존 활성화되어 있던 LLM ID를 지원하지 않는 사양인 경우, 호환 가능한 최선두 모델로 강제 자동 스위칭시킵니다.
      if (!models.some((model) => model.id === this.selectedModelId)) {
        this.selectedModelId = models[0]?.id || "";
      }
    },
    /**
     * @function selectModel
     * @description 입력창 툴바 서랍 등에서 유저가 명시적으로 다른 생성형 LLM AI 사양으로 변경할 때 구동됩니다.
     * @param {string} id - 타깃 AI 모델 고유 식별 Key
     */
    selectModel(id) {
      const model = this.modelMap[id];
      if (!model) return; // 무효 모델 스크리닝
      if (model.assistId !== this.selectedAssistantId) return; // 소속 어시스턴트 제약 조건 불일치 시 업데이트 차단 가드
      this.selectedModelId = id; // 검증 통과 시 확정 수립
    },
    /**
     * 특정 어시스턴트 룸에 종속된 스타터 추천 프롬프트 가이드 배열을 타깃 캐싱 수립합니다.
     */
    setExamplePrompts(assistantId, prompts = []) {
      this.examplePromptMap = {
        ...this.examplePromptMap,
        [assistantId]: prompts, // 동적 키 바인딩 맵 최신화
      };
    },
    /**
     * 시스템에서 공급된 프롬프트 추천 가이드 사전 전체를 통째로 스왑 갱신합니다.
     */
    setExamplePromptMap(promptMap = {}) {
      this.examplePromptMap = {...promptMap};
    },
    /**
     * 어드민 백엔드에서 전송된 프롬프트 조립 템플릿 마스터 목록을 배열 버퍼에 영구 동기화합니다.
     */
    setPromptTemplates(templates = []) {
      this.promptTemplates = [...templates];
    },
  },
});
