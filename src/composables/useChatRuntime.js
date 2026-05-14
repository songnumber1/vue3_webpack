/**
 * @file useChatRuntime.js
 * @description JavaScript module used by the Vue application runtime.
 * @author OpenAI
 */

import {computed, ref} from "vue";
import {createId} from "@/utils/id";
import {loadMarkdownShowcase} from "@/utils/markdownSamples";

const models = [
  {
    id: "assistant",
    label: "Assistant",
    description: "일반 질의응답과 개발 작업을 처리하는 기본 Assistant",
  },
  {
    id: "balanced",
    label: "균형 모델",
    description: "정확도와 속도를 균형 있게 사용",
  },
  {id: "fast", label: "빠른 모델", description: "짧은 답변과 일반 작업용 모델"},
];

const assistants = [
  {id: "default", label: "Assistant", description: "일반 업무와 질의응답"},
  {id: "ds", label: "DS Assistant", description: "프로젝트/개발 작업"},
  {id: "code", label: "Code Assistant", description: "코드 분석과 리팩토링"},
];

const histories = ref([
  {
    id: 1,
    title:
      "Vue 슬롯 vs 컴포넌트 구조 비교 및 실제 프로젝트에서의 활용 방법과 유지보수 관점에서의 차이점 분석",
    preview:
      "슬롯과 컴포넌트 분리 기준을 실제 프로젝트 유지보수 관점에서 비교합니다.",
  },
  {
    id: 2,
    title:
      "Compose vs Fragment 비교 및 상태 관리 흐름과 UI 재구성 시 장단점에 대한 상세 분석",
    preview:
      "Compose와 Fragment의 상태 흐름, UI 재구성, 성능 차이를 비교합니다.",
  },
  {
    id: 3,
    title:
      "Option API에서 Composition API로 마이그레이션 시 고려사항 및 코드 구조 개선 전략",
    preview:
      "Composition API 전환 시 구조, 사이드 이펙트, 유지보수 기준을 정리합니다.",
  },
  {
    id: 4,
    title:
      "Android vs React Native MVVM 아키텍처 비교 및 실제 프로젝트 적용 시 차이점",
    preview:
      "Native와 Hybrid 구조에서 MVVM 적용 방식과 성능 차이를 비교합니다.",
  },
  {
    id: 5,
    title: "npm 캐시 동기화 문제 원인 분석 및 개발 환경별 차이 해결 방법",
    preview:
      "동일 코드인데 PC별 결과가 달라지는 원인과 캐시 정리 기준을 정리합니다.",
  },
  {
    id: 6,
    title:
      "웹앱 인터뷰 질문 구성 및 실제 서비스 환경에서의 코드 설계 방식 검증",
    preview:
      "웹앱 인터뷰에서 확인할 설계, 세션, 공통 컴포넌트 구성 기준입니다.",
  },
  {
    id: 7,
    title: "Spring Boot 응답 처리 구조 개선 및 공통 Response Wrapper 설계 전략",
    preview: "Spring Boot 공통 응답 구조와 예외 처리 설계 방식을 정리합니다.",
  },
  {
    id: 8,
    title:
      "Vue reactivity 내부 동작 원리 및 Proxy 기반 반응성 시스템 상세 분석",
    preview: "Vue 3 reactive/ref와 Proxy 기반 반응성 동작 원리를 설명합니다.",
  },
  {
    id: 50,
    type: "markdown-showcase",
    title:
      "Markdown 통합 렌더링 50가지 샘플: KaTeX, LaTeX, Code Block, Table, Mermaid, 외부 링크",
    preview:
      "수식, 코드블록, 표 래퍼, Mermaid, 외부 링크 조합 예제가 포함됩니다.",
  },
]);

const selectedModel = ref("assistant");
const selectedAssistantId = ref("default");
const conversations = ref({});

const currentAssistant = computed(
  () =>
    assistants.find((item) => item.id === selectedAssistantId.value) ||
    assistants[0]
);

/**
 * 대화 이력 id로 sidebar history 객체를 조회합니다.
 * @param {string|number} id 조회할 history id
 * @returns {{id: string|number, title: string, preview?: string, type?: string}|null}
 */
function getHistory(id) {
  const normalizedId = Number(id);
  return (
    histories.value.find((item) => Number(item.id) === normalizedId) || null
  );
}

/**
 * 메시지 첨부파일 중 blob URL을 해제하여 메모리 누수를 방지합니다.
 * @param {Array<{attachments?: Array<{url?: string}>}>} items 정리할 메시지 목록
 * @returns {void}
 */
function revokeMessageAttachments(items = []) {
  items.forEach((message) => {
    if (!Array.isArray(message.attachments)) return;
    message.attachments.forEach((file) => {
      if (file?.url?.startsWith?.("blob:")) URL.revokeObjectURL(file.url);
    });
  });
}

/**
 * 저장된 history 정보를 화면 표시용 메시지 목록으로 변환합니다.
 * @param {{id: string|number, title: string, preview?: string, type?: string}|null} history 대화 이력
 * @returns {Promise<Array<{id: string, role: string, content: string}>>}
 */
async function buildMessagesFromHistory(history) {
  if (!history) return [];
  if (history.type === "markdown-showcase") {
    const showcase = await loadMarkdownShowcase();
    return [
      {
        id: createId("message"),
        role: "user",
        content: `${history.title} 채팅방을 열어줘`,
      },
      {id: createId("message"), role: "assistant", content: showcase},
    ];
  }

  return [
    {id: createId("message"), role: "user", content: history.title},
    {
      id: createId("message"),
      role: "assistant",
      content: `${history.preview}\n\n이 화면은 저장된 대화를 선택했을 때의 샘플입니다. 실제 API나 저장소 없이 UI/UX 흐름만 재현합니다.`,
    },
  ];
}

/**
 * 대화방 메시지가 없으면 history 기반 샘플 메시지를 생성하고 캐시에 저장합니다.
 * @param {string|number} historyId 대화 이력 id
 * @returns {Promise<Array>} 대화 메시지 목록
 */
async function ensureConversation(historyId) {
  const history = getHistory(historyId);
  if (!history) return [];
  if (!conversations.value[history.id]) {
    conversations.value[history.id] = await buildMessagesFromHistory(history);
  }
  return conversations.value[history.id];
}

/**
 * 대화방 메시지 목록을 교체합니다.
 * @param {string|number} historyId 대화 이력 id
 * @param {Array} messages 저장할 메시지 목록
 */
function setConversation(historyId, messages) {
  conversations.value[historyId] = messages;
}

/**
 * 대화방 메시지와 첨부 blob URL을 함께 정리합니다.
 * @param {string|number} historyId 삭제할 대화 이력 id
 */
function clearConversation(historyId) {
  if (!historyId || !conversations.value[historyId]) return;
  revokeMessageAttachments(conversations.value[historyId]);
  delete conversations.value[historyId];
}

/**
 * 채팅 화면에서 공유하는 모델, Assistant, history, conversation 상태를 제공합니다.
 * @returns {{assistants: Array, currentAssistant: import('vue').ComputedRef, histories: import('vue').Ref<Array>, models: Array, selectedAssistantId: import('vue').Ref<string>, selectedModel: import('vue').Ref<string>, conversations: import('vue').Ref<Record<string, Array>>, getHistory: Function, ensureConversation: Function, setConversation: Function, clearConversation: Function, revokeMessageAttachments: Function}}
 */
export function useChatRuntime() {
  return {
    assistants,
    currentAssistant,
    histories,
    models,
    selectedAssistantId,
    selectedModel,
    conversations,
    getHistory,
    ensureConversation,
    setConversation,
    clearConversation,
    revokeMessageAttachments,
  };
}
