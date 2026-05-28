/**
 * @file composables/prompt/usePromptTool.js
 * @description 프롬프트 입력 도메인 composable입니다. 텍스트/첨부/도구/모델 선택 상태와 submit emit을 관리합니다.
 *
 * 프리징 코드 주석 기준:
 * - 이 주석은 코드 추적을 돕기 위한 설명이며 런타임 동작을 변경하지 않습니다.
 * - 함수/상태가 다른 composable, store, component로 전달되는 경우 호출 방향을 먼저 확인하세요.
 */

import {computed} from "vue";
import {useI18n} from "vue-i18n";
import {useChatStore} from "@/stores/chatStore";
import {useAssistantStore} from "@/stores/assistantStore";
import {
  PROMPT_MENU_TYPE,
  PROMPT_TOOL_DEFINITIONS,
  PROMPT_TEMPLATE_MODEL_IDS,
} from "@/constants/promptComposer";
import {resolvePromptTemplateToolIcon} from "@/constants/toolIcons";

/**
 * [순수 검증식] 특정 하위 툴 옵션 유닛이 전역 Pinia 스토어 설정값에 비추어 현재 점등(Active) 상태인지 판별합니다.
 * @param {Object} settings - Pinia 스토어 내 현재 활성화된 도구 스냅샷 데이터 팩
 * @param {Object} tool - 적격성을 판별할 타깃 도구 객체 소스
 */
/**
 * 현재 상태가 특정 조건을 만족하는지 판단합니다.
 */
function isToolOptionActive(settings, tool) {
  // 케이스 A: 프롬프트 템플릿형 도구인 경우 스토어의 활성 ID와 대조합니다.
  if (tool?.promptTemplateKey) return settings?.promptTemplateId === tool.id;
  if (!tool?.settingGroup) return false;

  const value = settings[tool.settingGroup];
  // 케이스 B: 멀티 체크박스 형태인 경우 배열 포함 여부를 판별하고, 단일 라디오 형태인 경우 밸류 일치 여부를 대조합니다.
  return Array.isArray(value) ? value.includes(tool.id) : value === tool.id;
}

/**
 * [다국어 헬퍼] 현재 유저의 브라우저 로케일에 맞춰 템플릿의 명칭을 분기 추출합니다 (유실 시 국문/영문 숏서킷 상속).
 */
function resolveTemplateLabel(template = {}, locale = "ko") {
  return locale === "en"
    ? template.nameEn || template.nameKo
    : template.nameKo || template.nameEn;
}

/**
 * [다국어 헬퍼] 현재 유저의 브라우저 로케일에 맞춰 템플릿의 상세 설명을 분기 추출합니다.
 */
function resolveTemplateDescription(template = {}, locale = "ko") {
  return locale === "en"
    ? template.descEn || template.descKo
    : template.descKo || template.descEn;
}

/**
 * [필터 검증식] 어시스턴트 모듈에서 공급되는 전체 프리셋 중 도구 메뉴에 바인딩할 수 있는 유효 규격 템플릿인지 스크리닝합니다.
 */
function isSelectableTemplate(template = {}) {
  if (!template?.id || template.default) return false;
  if (!PROMPT_TEMPLATE_MODEL_IDS.includes(template.modelId)) return false;
  return ["mail", "translate", "summary", "code"].includes(template.key);
}

/**
 * @function usePromptTool
 * @description 채팅 입력창 하단 툴바 메뉴 중 '확장 기능(Tools)' 서랍 내부에 노출될 아이템 정렬 및
 * 유저의 온/오프 인터랙션에 따른 스토어 동기화 트랜잭션을 전담 제어하는 컴포저블 유닛입니다.
 */
export function usePromptTool({
  props,
  toolMenuOpen,
  syncViewportMode,
  toggleMenu,
}) {
  const {t, locale} = useI18n();
  const chatStore = useChatStore();
  const assistantStore = useAssistantStore();

  // 프롬프트 코어 상수에 바인딩된 정적 설정형 도구(예: 웹 서치, 파일 분석 등)의 명세 레이아웃 구조체만 선행 스크리닝합니다.
  const settingToolDefinitions = PROMPT_TOOL_DEFINITIONS.filter(
    (tool) => !tool.promptTemplateKey
  );

  // ── 📊 [동적/정적 확장 도구 통합 빌드 파이프라인] ──────────────────
  // 가상 돔 템플릿 뷰 영역이 복잡한 분기문 없이 v-for 단일 루프로 툴 목록을 매끄럽게 그릴 수 있도록 포맷을 표준화 매핑합니다.
  const tools = computed(() => {
    const settings = chatStore.activePromptToolSettings;
    const modelId = props.modelValue || assistantStore.selectedModelId || "";

    // [스트림 A] 백엔드 어시스턴트 API 데이터에 기반한 '동적 프롬프트 템플릿 도구' 파싱 및 정형화
    const templateTools = assistantStore.promptTemplates
      .filter((template) => isSelectableTemplate(template))
      .filter((template) => !template.modelId || template.modelId === modelId) // 현재 선택된 AI 모델에 유효한 도구만 노출 가드
      .sort((a, b) => a.order - b.order)
      .map((template) => ({
        id: template.id,
        icon: "",
        iconSrc: resolvePromptTemplateToolIcon(template.key),
        label: resolveTemplateLabel(template, locale.value),
        description: resolveTemplateDescription(template, locale.value),
        promptTemplateKey: template.key,
        active: settings.promptTemplateId === template.id,
        activeCount: 0,
      }));

    // [스트림 B] 시스템 로컬 규격인 '정적 설정형 플러그인 도구(ex: 웹 검색 기능 군)' 구조화 매핑
    const settingTools = settingToolDefinitions.map((tool) => {
      // 자식 옵션(예: 웹 검색 -> 기간 필터 '1일 이내', '1주일 이내' 등)이 존재하는지 파악하고 다국어 처리 및 활성 플래그를 이식합니다.
      const children = Array.isArray(tool.children)
        ? tool.children.map((child) => ({
            ...child,
            label: t(child.labelKey),
            description: child.descriptionKey ? t(child.descriptionKey) : "",
            active: isToolOptionActive(settings, child),
            controlType: child.controlType || tool.childControlType || "",
          }))
        : undefined;

      // 현재 하위 자식 옵션 유닛 중 켜져 있는 칩들의 총 개수를 연산합니다 (UI 단 카운트 배지 노출용).
      const activeCount = children?.filter((child) => child.active).length || 0;

      const isSwitchParent = tool.parentControlType === "switch";
      // 특정 도구 그룹(예: webSearch)이 마스터 온/오프 상태인지 실시간 스토어 정밀 대조 판별
      const isEnabledGroup =
        tool.settingGroup === "webSearch" && settings.webSearchEnabled;

      return {
        ...tool,
        label: t(tool.labelKey),
        description: tool.descriptionKey ? t(tool.descriptionKey) : "",
        // 마스터 스위치형 도구라면 마스터 온/오프 상태를 추종하고, 일반 도구라면 자식 칩의 점등 여부가 곧 본체의 활성화 상태가 됩니다.
        active: isSwitchParent ? isEnabledGroup : activeCount > 0,
        activeCount,
        parentControlType: tool.parentControlType || "",
        childControlType: tool.childControlType || "",
        children,
      };
    });

    // 동적 도구 목록과 정적 도구 목록을 단일 불변 배열로 안전하게 결합 릴리즈합니다.
    return [...templateTools, ...settingTools];
  });

  /**
   * 유저가 툴바의 도구 설정 아이콘을 클릭했을 때 드롭다운/바텀시트 메뉴 서랍을 트리거합니다.
   */
  function openToolSelector() {
    if (props.disabled) return;
    syncViewportMode();
    toggleMenu(PROMPT_MENU_TYPE.tool);
  }

  /**
   * @function applyTool
   * @description [옵션 선택 인터셉터 인프라] 유저가 도구 서랍 내부의 특정 아이템 혹은 스위치를 터치했을 때
   * 성격에 맞는 Pinia 스토어 액션 핸들러를 정밀 분기 매핑 처리합니다.
   * @param {Object} tool - 사용자가 제어 클릭한 대상 도구의 설정 유닛 스냅샷 데이터
   */
  function applyTool(tool) {
    // 분기 1: 시스템 프롬프트 템플릿 카드(메일 작성 등)를 선택한 경우
    if (tool?.promptTemplateKey) {
      chatStore.setActivePromptTemplate(tool.id); // 전역 템플릿 아이디 수립 매핑
      toolMenuOpen.value = false; // 템플릿 가이드 패널이 인풋창 위에 팝업되므로 툴 서랍은 닫아줍니다.
      return;
    }

    // 분기 2: 마스터 온/오프 스위치 규격 도구(예: 웹 검색 마스터 스위치 그 자체)를 토글한 경우
    if (tool?.settingGroup && tool?.parentControlType === "switch") {
      chatStore.setPromptToolGroupEnabled(tool.settingGroup, !tool.active);
      return;
    }

    // 분기 3: 세부 하위 하위 옵션 칩(예: 검색 기간 정렬 칩 등)을 제어 선택한 경우
    if (tool?.settingGroup) {
      // 종속성 보정 가드: 하위 상세 옵션을 만졌다면, 꺼져있던 상위 마스터 대도구 그룹(webSearch) 상태를 완전 자동으로 선행 점등 마운트 시켜줍니다.
      if (tool.settingGroup === "webSearch") {
        chatStore.setPromptToolGroupEnabled(tool.settingGroup, true);
      }

      // 스토어 내부에서 single / multi 규칙에 의거해 단일 치환 혹은 배열 추가/제거 연산을 자동 분기 집행합니다.
      chatStore.togglePromptToolOption(
        tool.settingGroup,
        tool.id,
        tool.selectionMode
      );
      return;
    }

    // 예외 가드 가드: 정의되지 않은 비정형 아이템 클릭 시 안전하게 레이어를 클로즈합니다.
    toolMenuOpen.value = false;
  }

  // 확장 툴 팝업 컴포넌트 마크업 뷰 영역 바인딩 레이어로 핵심 자원 분출 반환
  return {
    tools,
    openToolSelector,
    applyTool,
  };
}
