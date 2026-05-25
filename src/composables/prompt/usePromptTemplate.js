/**
 * @file composables/prompt/usePromptTemplate.js
 * @description 프롬프트 입력 도메인 composable입니다. 텍스트/첨부/도구/모델 선택 상태와 submit emit을 관리합니다.
 *
 * 프리징 코드 주석 기준:
 * - 이 주석은 코드 추적을 돕기 위한 설명이며 런타임 동작을 변경하지 않습니다.
 * - 함수/상태가 다른 composable, store, component로 전달되는 경우 호출 방향을 먼저 확인하세요.
 */

import {computed, ref} from "vue";
import {useI18n} from "vue-i18n";
import {useAssistantStore} from "@/stores/assistantStore";
import {useChatStore} from "@/stores/chatStore";
import {PROMPT_TEMPLATE_MODEL_IDS} from "@/constants/promptComposer";

/**
 * [순수 검증식] 템플릿 객체 내부에 동적 조립용 커스텀 파라미터 필드(설정 그룹)들이 존재하는지 검증합니다.
 */
function hasTemplateFields(template = {}) {
  return Object.keys(template || {}).length > 0;
}

/**
 * @function resolveLocaleValue
 * @description [다국어 헬퍼] 다국어 맵 규격으로 들어오는 원격지 JSON 텍스트 오브젝트에서
 * 현재 사용자의 브라우저 언어 설정에 맞는 결과물을 파싱하되, 유실 시 한국어(ko) 또는 영어(en)를 숏서킷 폴백합니다.
 * @param {Object} value - 언어별 키를 가진 텍스트 믹스드 데이터 (예: { ko: '요약', en: 'Summary' })
 * @param {string} locale - 'ko' 또는 'en' 등의 현재 런타임 다국어 국가 코드
 */
/**
 * 현재 runtime, route, 설정 값에 따라 사용할 값을 결정합니다.
 */
function resolveLocaleValue(value = {}, locale = "ko") {
  if (!value || typeof value !== "object") return "";
  return value[locale] || value.ko || value.en || "";
}

/**
 * [필터 검증식] 어시스턴트 풀에서 공급되는 전체 프리셋 중 실제 화면 단 유저가 선택 가능한
 * 적격성 프롬프트 템플릿 규격(메일, 번역, 요약, 코드 중 하나이면서 지정 LLM에 매핑된 것)인지 스크리닝합니다.
 */
function isSelectableTemplate(template = {}) {
  if (!template?.id || template.default) return false; // 기본 고정값(가이드)은 선택 목록에서 제외
  if (!PROMPT_TEMPLATE_MODEL_IDS.includes(template.modelId)) return false; // 전송 불가능한 인프라 ID 차단
  return ["mail", "translate", "summary", "code"].includes(template.key);
}

/**
 * @function usePromptTemplate
 * @description 입력창 상단에 팝업되는 프롬프트 어시스턴트 패널 및 하위 라디오/체크박스 옵션 그룹의
 * 데이터 마운트, 언어 바인딩, Pinia 동기화를 전담 조율하는 컴포저블 마스터 유닛입니다.
 * @param {Object} [config={}] - 현재 선택된 AI 상위 모델 컨텍스트 고리
 * @param {Ref<string>} config.modelId - 상위 부모 컴포저블로부터 연계 승인받은 현재 실시간 LLM ID
 */
export function usePromptTemplate({modelId} = {}) {
  const {locale} = useI18n();
  const assistantStore = useAssistantStore();
  const chatStore = useChatStore();

  // 모바일 뷰포트 상태에서 옵션 변경 바텀시트를 전개할 때, 현재 터치하여 진입한 대상 그룹의 고유 ID를 마킹하는 버퍼 고리
  const activeMobileGroupId = ref("");

  // Pinia 전역 채팅 저장소 내부에 적치 보존되고 있는 '현재 활성화된 프롬프트 도구 확장 세팅' 스냅샷 스토어 구독
  const activeSettings = computed(() => chatStore.activePromptToolSettings);

  // ── 📊 [1. 현재 LLM 사양에 일치하는 템플릿 목록 동적 정렬] ──────────────────
  const currentModelTemplates = computed(() => {
    const selectedModelId =
      modelId?.value || assistantStore.selectedModelId || "";

    return (
      assistantStore.promptTemplates
        // 검증식 A: 지정된 고유 비즈니스 키 도메인 영역에 포함되는 템플릿인지 판별
        .filter((template) => isSelectableTemplate(template))
        // 검증식 B: 현재 선택한 AI 모델 전용 프리셋이거나 글로벌 공용 프리셋인지 대조 판별
        .filter(
          (template) =>
            !template.modelId || template.modelId === selectedModelId
        )
        // 정렬 룰: 어시스턴트 어드민 저장소에서 가이드 지정한 시퀀스 가중치 오더 정렬 순서대로 배치
        .sort((a, b) => a.order - b.order)
    );
  });

  // ── 🎯 [2. 사용자가 최종 클릭하여 선택 활성화한 단일 템플릿 마스터 정보 추출] ──────────────────
  const selectedTemplate = computed(() => {
    const selectedId = activeSettings.value.promptTemplateId;
    if (!selectedId) return null;

    return (
      currentModelTemplates.value.find(
        (template) => template.id === selectedId
      ) || null
    );
  });

  // 유저가 조립 타깃팅한 세부 변수 옵션 버퍼 팩을 추출합니다 (예: { 'length': 'short', 'tone': 'formal' })
  const selectedTemplateOptions = computed(() => {
    return activeSettings.value.promptTemplateOptions || {};
  });

  // ── 🧬 [3. 하위 동적 옵션 그룹 변환 파이프라인 (추상화 매핑)] ──────────────────
  // 백엔드 원시 JSON 데이터 트리 구조를 순회하여 Vue 3 마크업 템플릿이 즉각 라디오 버튼 그룹 등으로 순회 렌더링할 수 있도록
  // 다국어 가치 부여 및 현재 선택 태그 매칭 연산을 전격 일괄 수행합니다.
  const selectedTemplateGroups = computed(() => {
    const template = selectedTemplate.value?.template || {};
    return (
      Object.entries(template)
        .map(([groupId, group]) => {
          // 해당 템플릿 그룹 하위에 속한 세부 버튼 아이템 목록 추출 가공
          const options = Array.isArray(group.content)
            ? group.content.map((option) => ({
                tag: option.tag || option.ko || option.en || "",
                label: resolveLocaleValue(option, locale.value),
              }))
            : [];

          // 사용자가 이미 영구 선택해 둔 태그값 혹은 사양 명세에 지정된 최초 기본 원소 아이템을 기본값으로 상속 처리
          const selectedTag =
            selectedTemplateOptions.value[groupId] || options[0]?.tag || "";
          const selectedOption =
            options.find((option) => option.tag === selectedTag) ||
            options[0] ||
            null;

          return {
            id: groupId, // 파라미터 식별 고유 명칭 (예: 'tone')
            label: resolveLocaleValue(group, locale.value), // 그룹 라벨 타이틀 (예: '말투/어조')
            type: group.type || "radio", // 제어 UI 컨트롤 마운트 규격 (radio, checkbox 등)
            options, // 하위 선택지 목록 어레이
            selectedTag, // 현재 선택 잠금 상태인 아이템의 태그 식별자
            selectedLabel: selectedOption?.label || "", // 현재 선택 잠금 상태인 아이템의 화면 노출용 명칭
          };
        })
        // 정상적인 언어팩 명칭과 하위 선택 사양이 실재하는 적격성 렌더링 대상 그룹만 최종 화면 릴리즈 필터링
        .filter((group) => group.label && group.options.length > 0)
    );
  });

  // 📱 [모바일 보정] 유저가 스마트폰 환경에서 특정 그룹 세부 변경 바텀시트를 띄웠을 때, 해당 시트 내부에 드로잉될 타깃 설정 정보
  const activeMobileGroup = computed(() => {
    return (
      selectedTemplateGroups.value.find(
        (group) => group.id === activeMobileGroupId.value
      ) || null
    );
  });

  // 입력창 위에 최종 템플릿 조립 가이드용 전용 컨트롤 패널 컴포넌트(`SelectedTemplatePanel`)를 시각적으로 가시화 노출할지 여부 판별
  const hasSelectedTemplatePanel = computed(() => {
    return Boolean(
      selectedTemplate.value &&
      hasTemplateFields(selectedTemplate.value.template) &&
      selectedTemplateGroups.value.length > 0
    );
  });

  /**
   * [단순 뷰 헬퍼 인터페이스] 특정 라디오 UI 칩 아이템 버튼이 활성화 점등(Active CSS) 상태를 부여받아야 하는지 체크합니다.
   */
  function isTemplateOptionActive(group, option) {
    return (group.selectedTag || group.options[0]?.tag) === option.tag;
  }

  /**
   * @function selectTemplateOption
   * @description 사용자가 특정 옵션 아이템(예: 말투 -> '격식있게')을 마우스로 클릭하거나 터치했을 때
   * 최종 확정 값을 글로벌 Pinia 캐시 영역에 적치 동기화하고 모바일 시트를 폐쇄 조치합니다.
   */
  function selectTemplateOption(groupId, optionTag) {
    chatStore.setPromptTemplateOption(groupId, optionTag);
    activeMobileGroupId.value = ""; // 모바일 바텀시트 가동 상태 리셋
  }

  function openTemplateOptionSheet(groupId) {
    activeMobileGroupId.value = groupId;
  }

  function closeTemplateOptionSheet() {
    activeMobileGroupId.value = "";
  }

  // 템플릿 대시보드 컴포넌트 및 확장 툴바 렌더링 팩 주입 버스 노출 반환
  return {
    selectedTemplate,
    selectedTemplateGroups,
    hasSelectedTemplatePanel,
    activeMobileGroup,
    isTemplateOptionActive,
    selectTemplateOption,
    openTemplateOptionSheet,
    closeTemplateOptionSheet,
  };
}
