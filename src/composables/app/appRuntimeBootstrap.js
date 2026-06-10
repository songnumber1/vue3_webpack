/**
 * @file composables/app/appRuntimeBootstrap.js
 * @description Vue Composition API 기반 상태/행동 분리 모듈입니다. UI 컴포넌트의 복잡도를 낮추기 위해 사용됩니다.
 *
 * 프리징 코드 주석 기준:
 * - 이 주석은 코드 추적을 돕기 위한 설명이며 런타임 동작을 변경하지 않습니다.
 * - 함수/상태가 다른 composable, store, component로 전달되는 경우 호출 방향을 먼저 확인하세요.
 */

import {resolveChatApis} from "@/api/runtime/chatApis";
import {adaptAssistantList} from "@/adapters/assistantAdapter";
import {adaptModelList, filterAvailableModels} from "@/adapters/modelAdapter";
import {adaptChatHistoryList} from "@/adapters/chatAdapter";
import {
  adaptExamplePromptList,
  adaptPromptTemplateList,
} from "@/adapters/promptAdapter";
import {DEFAULT_ASSISTANT_IMAGE} from "@/constants/assistantImages";

const ASSISTANT_STUDIO_PORTAL_ID = "assistant-studio";
const CONNECTOR_STORE_PORTAL_ID = "connector-store";

function createAssistantStudioPortal() {
  return {
    id: ASSISTANT_STUDIO_PORTAL_ID,
    sourceId: ASSISTANT_STUDIO_PORTAL_ID,
    type: "studio",
    label: "Assistant Studio",
    name: "Assistant Studio",
    description: "맞춤형 Assistant를 탐색하고 직접 만들 수 있습니다.",
    order: 9999,
    isStudio: true,
    isAuthorized: true,
    isDeleted: false,
    isFixed: false,
    isPrivate: false,
    hasRag: false,
    ...DEFAULT_ASSISTANT_IMAGE,
    raw: {assistId: ASSISTANT_STUDIO_PORTAL_ID, studioYN: true},
  };
}

function createConnectorStorePortal() {
  return {
    id: CONNECTOR_STORE_PORTAL_ID,
    sourceId: CONNECTOR_STORE_PORTAL_ID,
    type: "mcp",
    label: "Connector Store",
    name: "Connector Store",
    description: "MCP Connector를 탐색하고 구독할 수 있습니다.",
    order: 10000,
    isStudio: true,
    isAuthorized: true,
    isDeleted: false,
    isFixed: false,
    isPrivate: false,
    hasRag: false,
    ...DEFAULT_ASSISTANT_IMAGE,
    raw: {assistId: CONNECTOR_STORE_PORTAL_ID, studioYN: true, mcpYN: true},
  };
}

function appendAssistantStudioPortal(assistants = []) {
  const nextAssistants = [...assistants];
  if (!nextAssistants.some((item) => item.id === ASSISTANT_STUDIO_PORTAL_ID)) {
    nextAssistants.push(createAssistantStudioPortal());
  }
  if (!nextAssistants.some((item) => item.id === CONNECTOR_STORE_PORTAL_ID)) {
    nextAssistants.push(createConnectorStorePortal());
  }
  return nextAssistants;
}

/**
 * [순수 유틸리티] 객체 배열 리스트를 특정 ID 고유 키 기반의 인메모리 딕셔너리 맵 구조로 재가공 환원합니다.
 * 하위 모듈에서 O(1) 시간 복잡도로 특정 마스터 엔티티를 고속 역참조할 수 있게 돕습니다.
 * @param {Array} [items=[]] - 변환할 엔티티 객체 배열
 * @returns {Object} ID 기반 고속 조회가 가능한 해시 맵 구조체
 */
/**
 * 이 모듈 내부의 세부 처리 단계입니다. 호출부에서 의미가 드러나지 않는 중간 로직을 캡슐화합니다.
 */
function toMap(items = []) {
  return items.reduce((acc, item) => {
    if (item?.id) acc[item.id] = item;
    return acc;
  }, {});
}

/**
 * [순수 유틸리티] 가용한 전체 AI 거대 모델 라인업을 소속된 부모 AI 어시스턴트 식별 키(assistId) 그룹별로 묶어 분류합니다.
 * 그룹 내에서는 관리자가 수립한 정렬 순서(`order`) 기준 정방향 오름차순으로 정렬합니다.
 * @param {Array} [models=[]] - 정형화 완료된 전체 모델 배열 목록
 * @returns {Object} 어시스턴트 ID를 Key로 하고 소속 모델 배열을 Value로 갖는 바인딩 그룹 맵
 */
/**
 * 이 모듈 내부의 세부 처리 단계입니다. 호출부에서 의미가 드러나지 않는 중간 로직을 캡슐화합니다.
 */
function groupModelsByAssistant(models = []) {
  return models.reduce((acc, model) => {
    if (!model?.assistId) return acc;
    if (!acc[model.assistId]) acc[model.assistId] = [];
    acc[model.assistId].push(model);
    // 주입과 동시에 가중치 정렬 순서 보정을 실시간 집행합니다.
    acc[model.assistId].sort((a, b) => a.order - b.order);
    return acc;
  }, {});
}

/**
 * [순수 유틸리티] 유저 세션의 개인화 프리셋 정보(`presetInfo`)를 역추적하여 가장 직전에 다루었던 최적의 첫 진입용 AI 어시스턴트를 영리하게 선택합니다.
 * 매칭되는 과거 캐시 유실 시 시스템 전체 가용 어시스턴트 중 가중치가 가장 높은 0번째 요소를 디폴트로 폴백 선점합니다.
 * @param {Array} [assistants=[]] - 검증 인가 완료된 전체 어시스턴트 배열
 * @param {Object} [accessInfo={}] - 부트스트랩을 통해 도달한 현재 로그인 유저 메타 정보 세션
 * @returns {Object|null} 최초 홈 화면 렌더링에 매운맛 인젝션될 초기 타깃 어시스턴트 인스턴스
 */
/**
 * 이 모듈 내부의 세부 처리 단계입니다. 호출부에서 의미가 드러나지 않는 중간 로직을 캡슐화합니다.
 */
function pickInitialAssistant(assistants = [], accessInfo = {}) {
  const preferredIds = Object.keys(accessInfo?.user?.presetInfo?.assist || {});
  // 유저 선호 프리셋 데이터에 실재하고, 동시에 현재 기기 인프라 권한 리스트(assistants) 상에서도 엄연히 살아있는 유효 ID를 매칭합니다.
  const latestPreferredAssistantId = preferredIds.find((id) =>
    assistants.some((item) => item.id === id)
  );

  return (
    assistants.find((item) => item.id === latestPreferredAssistantId) ||
    assistants[0] ||
    null
  );
}

/**
 * [순수 유틸리티] 선점 수립된 초기 가동 어시스턴트를 기반으로, 사용자가 이전에 락을 걸고 사용하던 맞춤형 주력 거대 AI 모델을 매칭 추출합니다.
 * @param {Object} assistant - 앞선 단계에서 선점 완료된 초기 활성 어시스턴트 객체
 * @param {Object} [modelMapByAssistant={}] - 어시스턴트 그룹별 모델 매핑 딕셔너리
 * @param {Object} [accessInfo={}] - 유저 계정 프리셋 메타 세션
 * @returns {Object|null} 최종 초기화에 탑재될 LLM 모델 인스턴스
 */
/**
 * 이 모듈 내부의 세부 처리 단계입니다. 호출부에서 의미가 드러나지 않는 중간 로직을 캡슐화합니다.
 */
function pickInitialModel(
  assistant,
  modelMapByAssistant = {},
  accessInfo = {}
) {
  if (!assistant) return null;
  // 해당 특정 어시스턴트방 하위에서 유저가 가장 애용하던 고유 모델 ID 프리셋을 스캔합니다.
  const presetModelId = accessInfo?.user?.presetInfo?.assist?.[assistant.id];
  const models = modelMapByAssistant[assistant.id] || [];

  // 프리셋 지정 모델 -> 가용 모델 리스트 내 0순위 모델 -> 전체 무효 시 널(Null) 순으로 가드 레이어를 구축합니다.
  return models.find((item) => item.id === presetModelId) || models[0] || null;
}

/**
 * @function bootstrapAppRuntime
 * @description 서비스 인입 시점에 유저 세션 인증, 일반/스튜디오 어시스턴트, 가용 LLM 모델 딕셔너리,
 * 과거 대화 서랍 목록, 마스터 프롬프트 템플릿까지 서비스 가동에 필요한 모든 공용 자원을 단 한 번의 메가 트랜잭션으로
 * 병렬 풀링 연산하여 마운트 세팅하는 코어 인프라 초기화 함수입니다.
 * @param {Object} [options={}] - 오버라이드 제어 플래그 옵션
 * @param {Object} options.accessInfoOverride - 기 확보된 유저 세션 정보가 있을 시 중복 통신 차단용으로 주입하는 패스용 세션 객체
 * @returns {Promise<Object>} 프론트엔드 Pinia 글로벌 인메모리 스토어 진입용 규격 마스터 컨텍스트 데이터 통틀음 팩
 */
export async function bootstrapAppRuntime(options = {}) {
  const {accessInfoOverride = null} = options;
  // 1. 현재 런타임 플랫폼 규격에 매핑된 하위 엔드포인트 API 모듈 단락들을 전격 빌드 로드합니다.
  const {
    accessApi,
    assistantApi,
    modelApi,
    chatHistoryApi,
    examplePromptApi,
    promptTemplateApi,
  } = resolveChatApis();

  // 2. 이미 존재하는 유저 보안 컨텍스트가 있다면 불필요한 HTTP 소켓 통신을 생략 처리하고 즉시 resolve 처리합니다.
  const accessInfoPromise = accessInfoOverride
    ? Promise.resolve(accessInfoOverride)
    : accessApi.getAccessInfo({language: "ko", entryType: "main"});

  // [네트워크 핵심 최적화: 병렬 컨소시엄 개통]
  // 특정 API 소스가 유실되거나 지연(Latency) 처리가 걸리더라도 전체 앱 초기화 시동 자체가 완전히 크래시되며 먹통되는 대참사를 방어하기 위해
  // 개별 프로미스의 완결/실패 상태를 독자적으로 수용하는 Promise.allSettled 파이프라인을 기동합니다.
  const bootstrapResults = await Promise.allSettled([
    accessInfoPromise, // 0: 현재 접속자 보안 권한 스냅샷
    assistantApi.getAssistants(), // 1: 글로벌 공용 AI 마스터 명세 리스트
    assistantApi.getStudios(), // 2: 커스텀 스튜디오 개인화 페르소나 리스트
    modelApi.getModels(), // 3: 인프라 가용 공식 거대 모델 라인업
    modelApi.getStudioModels(), // 4: 스튜디오 전용 파인튜닝 가상 모델 라인업
    chatHistoryApi.getChatHistoryList(), // 5: 사용자의 사이드바 노출용 대화방 히스토리 서랍 목록
    promptTemplateApi?.getPromptTemplates?.(), // 6: 추천 시스템 내부 공용 프롬프트 매스터 가이드라인
  ]);

  /**
   * [인라인 방어 헬퍼] AllSettled 결과 배열 색인을 안전하게 스캔하여, 통신 성공(Fulfilled) 시의 가치 데이터를 추출하고 실패(Rejected) 시 기본 캐시값으로 원복 시켜줍니다.
   */
  const readSettledValue = (index, fallbackValue) =>
    bootstrapResults[index].status === "fulfilled"
      ? bootstrapResults[index].value
      : fallbackValue;

  // 가장 중요한 핵심 초동 게이트웨이인 유저 권한 정보(0번)가 최종 누적 유실되었는지 검증 가드합니다.
  const accessInfo = readSettledValue(0, null);
  if (!accessInfo) {
    throw (
      bootstrapResults[0].reason || new Error("Access info bootstrap failed.")
    );
  }

  // 3. 다이렉트 통신 완료 본으로부터 날것의 백엔드 레코드 소스들을 변수에 안전하게 적치합니다.
  const assistantRaw = readSettledValue(1, []);
  const studioRaw = readSettledValue(2, []);
  const modelRaw = readSettledValue(3, []);
  const studioModelRaw = readSettledValue(4, []);
  const chatHistoryRaw = readSettledValue(5, []);
  const promptTemplateRaw = readSettledValue(6, {list: []});

  // 4. [데이터 정형화 및 결합 단계] 일반 어시스턴트와 스튜디오 어시스턴트 원시 배열을 어댑터를 거쳐 단일 마스터 배열로 병합 융합합니다.
  const assistants = appendAssistantStudioPortal([
    ...adaptAssistantList(assistantRaw),
    ...adaptAssistantList(studioRaw),
  ])
    .filter((item) => item.isAuthorized && !item.isDeleted) // 보안상 사용 인가 필터 재차 정밀 검증
    .sort((a, b) => a.order - b.order); // 화면 가중치 배치 순 정렬 조율

  // 5. 레거시 데이터와의 하위 호환성 확보 및 유실 모델 추적 진단을 위해 삭제된 모델 속성까지 모두 포괄 파싱 수집합니다.
  const allModels = [
    ...adaptModelList(modelRaw, {includeDeleted: true}),
    ...adaptModelList(studioModelRaw, {includeDeleted: true}),
  ];

  // 6. 현재 시점 물리적으로 동작 상태가 청신호인 실제 활용 가능 모델만을 선별 추려냅니다.
  const models = filterAvailableModels(allModels);

  // 7. 런타임 하위 오케스트레이터 탐색용 O(1) 고속 매스터 해시 테이블 딕셔너리 맵을 축조합니다.
  const assistantMap = toMap(assistants);
  const modelMap = toMap(allModels);
  const modelMapByAssistant = groupModelsByAssistant(models);

  // 8. 수립 완료된 마스터 사전 맵을 전처리 컨텍스트 정보로 공급하여 과거 대화 서랍 목록 정형화를 완성합니다.
  const chatHistories = adaptChatHistoryList(chatHistoryRaw, {
    assistantMap,
    modelMap,
  });

  const promptTemplates = adaptPromptTemplateList(promptTemplateRaw);

  // 9. 최종 수집된 빅 데이터 정보 풀과 유저 세션 선호 프리셋 정보를 먼저 대조하여 초동 디폴트 페르소나 조합쌍을 도출해 냅니다.
  // 예시 질문은 모든 assistant를 한꺼번에 호출하지 않고, 최초 화면에 실제로 필요한 assistant의 것만 선로딩합니다.
  const initialAssistant = pickInitialAssistant(assistants, accessInfo);
  const initialModel = pickInitialModel(
    initialAssistant,
    modelMapByAssistant,
    accessInfo
  );

  // 10. 최초 로그인/새로고침 성능을 위해 현재 assistant의 추천 예시 질문만 가져옵니다.
  // 다른 assistant의 예시는 사용자가 assistant를 선택할 때 preloadExamplePrompts()에서 지연 로드합니다.
  let examplePromptMap = {};
  if (initialAssistant?.id) {
    const examplePromptResult = await Promise.allSettled([
      examplePromptApi.getExamplePrompts({
        assistId: initialAssistant.id,
        studioYN: initialAssistant.type === "studio",
      }),
    ]);

    if (examplePromptResult[0]?.status === "fulfilled") {
      examplePromptMap = {
        [initialAssistant.id]: adaptExamplePromptList(
          examplePromptResult[0].value
        ),
      };
    }
  }

  // 글로벌 스토어 엔진 유닛이 그대로 받아 인메모리에 장착할 완성형 마스터 패키지를 반환 처리합니다.
  return {
    accessInfo,
    assistants,
    models,
    allModels,
    assistantMap,
    modelMap,
    modelMapByAssistant,
    chatHistories,
    examplePromptMap,
    promptTemplates,
    initialAssistantId: initialAssistant?.id || "",
    initialModelId: initialModel?.id || "",
  };
}

/**
 * [원격 API 브릿지 - 서브 프롬프트 딕셔너리] 사내 혹은 시스템 전역에 기 배포 보존된 고급 프롬프트 템플릿 마스터 라이브러리 목록 카드 자원을 조회 수집합니다.
 */
export async function loadPromptTemplates(params = {}) {
  const {promptTemplateApi} = resolveChatApis();
  const response = await promptTemplateApi.getPromptTemplates(params);
  return adaptPromptTemplateList(response);
}
