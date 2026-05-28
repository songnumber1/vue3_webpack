/**
 * @file adapters/chatAdapter.js
 * @description 백엔드/mock 원본 응답을 화면에서 쓰기 쉬운 형태로 정규화하는 adapter입니다.
 *
 * 프리징 코드 주석 기준:
 * - 이 주석은 코드 추적을 돕기 위한 설명이며 런타임 동작을 변경하지 않습니다.
 * - 함수/상태가 다른 composable, store, component로 전달되는 경우 호출 방향을 먼저 확인하세요.
 */

import {CHAT_KEYS, MESSAGE_KEYS} from "@/constants/apiKeys";
import {MESSAGE_ROLES} from "@/constants/domain";
import {toBoolean} from "@/utils/typeConvert";

function firstText(...values) {
  const found = values.find(
    (value) => typeof value === "string" && value.trim() !== ""
  );
  return found || "";
}

/**
 * @function adaptChatHistory
 * @description 백엔드에서 전송된 개별 채팅방 원시 이력 객체를 프론트엔드 컴포넌트 표준 규격 데이터 구조로 반환(Adapting)합니다.
 * 백엔드 레거시 모델 키 대응 및 어시스턴트 매스터 맵 정보 역참조 융합을 수행합니다.
 * @param {Object} [raw={}] - 백엔드 API 서버로부터 수신한 원시(Raw) 채팅 이력 JSON 데이터
 * @param {Object} [context={}] - 스토어 등으로부터 주입받은 인메모리 매스터 맵 객체
 * @param {Object} context.modelMap - AI 모델 매스터 사전 딕셔너리
 * @param {Object} context.assistantMap - AI 페르소나 어시스턴트 매스터 사전 딕셔너리
 * @returns {Object} 프론트엔드가 일관되게 보증 처리할 수 있는 정형화된 단일 히스토리 데이터 구조체
 */
export function adaptChatHistory(raw = {}, context = {}) {
  // 백엔드 API 변경에 유연하게 대응하기 위해 최신 모델 키와 구버전 레거시 모델 키를 순차적으로 폴백 풀링합니다.
  const modelId = raw[CHAT_KEYS.MODEL_ID] || raw[CHAT_KEYS.LEGACY_MODEL_ID];
  // 컨텍스트 매스터 사전 정보에서 해당 모델 ID를 역추적하여 기본 객체를 매핑합니다.
  const model = context.modelMap?.[modelId] || null;
  // 찾아낸 모델 소스의 소속 어시스턴트 ID를 기점으로 실제 페르소나 어시스턴트 세부 명세를 바인딩합니다.
  const assistant = model ? context.assistantMap?.[model.assistId] : null;

  return {
    id: raw[CHAT_KEYS.ID], // 대화방 고유 식별 키 ID
    title: raw[CHAT_KEYS.TITLE] || "새 대화", // 사이드바 및 헤더용 타이틀 제목 문자열
    preview: raw[CHAT_KEYS.TITLE] || "저장된 대화", // 목록 서브 프리뷰 텍스트
    modelId, // 바인딩된 LLM 모델 ID
    assistantId: model?.assistId || raw.assistId || raw.assistantId || null, // 소속 어시스턴트 ID 다중 폴백 가드 추출
    assistantType: assistant?.type || null, // 어시스턴트 타입 (예: "studio", "default")
    assistantLabel: assistant?.label || "", // 화면 표기용 어시스턴트 한글 닉네임 라벨
    modelLabel: model?.label || "", // 화면 표기용 모델 버전 한글 닉네임 라벨
    isPinned: toBoolean(raw[CHAT_KEYS.BOOKMARK_YN]), // 문자열 기반 여부(Y/N 등)를 완벽한 불리언(Boolean) 가치로 강제 캐스팅
    endedAt: raw[CHAT_KEYS.ENDED_AT] || "", // 대화 최종 종료/마감 시간 스탬프
    userId: raw[CHAT_KEYS.USER_ID] || "", // 작성자 유저 고유 ID 식별자
    raw, // [디버깅 디렉토리] 원본 백엔드 소스를 하위에 통째로 격리 보존
  };
}

/**
 * @function adaptChatHistoryList
 * @description 백엔드에서 받아온 날것의 채팅 목록 배열 전체를 일괄 규격화(Mapping)하고 비정상 레코드를 걸러낸 뒤 최적의 규칙으로 정렬합니다.
 * @sorting 규칙: 1순위 - 즐겨찾기 북마크(`isPinned`) 최상단 배치 / 2순위 - 종료 일시(`endedAt`) 기준 완전한 최신순 정렬
 * @param {Array} [rawItems=[]] - 백엔드 API로부터 도달한 정돈되지 않은 원시 리스트 배열
 * @param {Object} [context={}] - 마스터 맵 메타 정보 묶음
 * @returns {Array} 화면 정렬 알고리즘이 물리적으로 최종 완료된 규격화 히스토리 배열 목록
 */
export function adaptChatHistoryList(rawItems = [], context = {}) {
  return rawItems
    .map((item) => adaptChatHistory(item, context)) // 1단계: 모든 개별 요소를 규격 어댑팅 처리합니다.
    .filter((item) => item.id) // 2단계: 고유 ID가 유실된 무효(Garbage) 데이터 레코드는 필터 제외 소거합니다.
    .sort((a, b) => {
      // 정렬 조건 A: 두 방의 북마크 핀 고정 상태가 엄연히 다르다면, 즐겨찾기를 선점한 객체(-1)를 무조건 상단 0순위로 강제 배치합니다.
      if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;

      // 정렬 조건 B: 동일 등급 내에서는 최종 타임스탬프 밀리초 자원을 역산하여 최신순 역순 배치를 수행합니다.
      return (
        new Date(b.endedAt || 0).getTime() - new Date(a.endedAt || 0).getTime()
      );
    });
}

/**
 * @function adaptMessage
 * @description 백엔드 스트림 혹은 과거 로그로부터 복원된 개별 메시지(말풍선) 원시 오브젝트를 프론트엔드 컴포넌트 표준 규격 데이터 구조로 변환합니다.
 * 특히 RAG(검색 증강 생성) 출처 레퍼런스 데이터 및 거대 모델의 추론(Reasoning/CoT) 텍스트 규격을 안전하게 정형화합니다.
 * @param {Object} [raw={}] - 단일 메시지 원시 API 응답 JSON 데이터
 * @returns {Object} 뷰 인프라 및 마크다운 파서가 완벽하게 인지할 수 있는 정문화된 단일 메시지 객체
 */
export function adaptMessage(raw = {}) {
  const reasoningContent = firstText(
    // 회사 이전 대화 목록 규격은 reasoningContent(camelCase)입니다.
    raw[MESSAGE_KEYS.REASONING_CONTENT],
    // 실시간 stream 또는 일부 백엔드/저장소가 snake_case를 그대로 저장한 경우도 흡수합니다.
    raw.reasoning_content,
    raw.reasoningContent,
    raw.reasoning,
    raw.reason,
    raw.reasonContent
  );
  const content = firstText(
    raw[MESSAGE_KEYS.CONTENT],
    raw.answer,
    raw.body,
    reasoningContent
  );

  return {
    id: raw[MESSAGE_KEYS.ID], // 말풍선 고유 고정 ID 키
    role:
      raw[MESSAGE_KEYS.ROLE] === MESSAGE_ROLES.USER
        ? MESSAGE_ROLES.USER
        : MESSAGE_ROLES.ASSISTANT, // 메시지 발송 주체 권한 역할 매핑 보정 (User 혹은 Assistant)
    content, // AI 최종 완성 답변 혹은 사용자의 질문 본문 텍스트 스트링 문자열

    // LLM 추론 모델(O1, DeepSeek-R1 등)의 생각 프로세스 내역(Reasoning Content)을 통합 추출 가드합니다.
    reasoningContent,

    // 현재 생각 프로세스의 마감 가이드 상태를 산출합니다. 내용이 이미 완벽히 실재한다면 수립 완료('completed') 처리합니다.
    reasoningStatus:
      raw[MESSAGE_KEYS.REASONING_STATUS] ||
      (reasoningContent ? "completed" : ""),
    isReasoning: toBoolean(raw.isReasoning) || Boolean(reasoningContent),

    createdAt: raw[MESSAGE_KEYS.SENT_AT] || "", // 서버에 영구 안착 타임스탬프 시간 기록
    isSent: toBoolean(raw.isSend), // 소켓 전송 성공 완료 승인 플래그 캐스팅
    isRag: toBoolean(raw.isRAG), // 외부 지식 베이스 검색(RAG) 엔진 경유 여부 판별
    isRagCot: toBoolean(raw.isRagCot), // RAG 검색 과정에서 지식 연쇄 추론(CoT)이 가동되었는지 여부
    intention: raw.intention || null, // 사용자의 의도 분석 원격 코드 분류 태그
    tags: Array.isArray(raw.tags) ? raw.tags : [], // 의미론적 분류 메타 태그 배열 가드 처리

    // RAG 엔진이 답변 도출을 위해 참고 수집한 원격 문서 출처 레퍼런스(References) 배열을 유연하게 하이브리드 파싱 수집합니다.
    references:
      raw[MESSAGE_KEYS.REFERENCES] || raw[MESSAGE_KEYS.LEGACY_REFERENCES] || [],
    raw, // 원본 백엔드 소스를 하위에 통째로 격리 보존
  };
}

/**
 * @function adaptMessageList
 * @description 단일 방 진입 시 쏟아져 들어오는 수많은 과거 대화 말풍선 원시 로그 배열 전체를 깨끗하게 정형화 정렬합니다.
 * @sorting 규칙: 유효 데이터 검증 필터링 완료 후, 대화가 오간 시간순(`createdAt`) 기준 오름차순(과거 -> 현재 순) 정렬 배치
 * @param {Array} [rawItems=[]] - 백엔드 엔드포인트에서 긁어온 날것의 대화 로그 배열 소스 리스트
 * @returns {Array} 시간 순서 정합성이 100% 보증되어 화면 대화창 말풍선 레이아웃에 즉각 뿌릴 수 있는 완성형 배열 리스트
 */
export function adaptMessageList(rawItems = []) {
  return (
    rawItems
      .map(adaptMessage) // 1단계: 순회하며 메시지 전형 양식 가공 적용
      // 2단계: 핵심 식별 ID가 누락되었거나 본문 데이터가 undefined로 날아가 프론트 화면 크래시를 유발할 소지가 있는 악성 유실 레코드를 자동 소거합니다.
      .filter((item) => item.id && item.content !== undefined)
      // 3단계: 채팅 타임라인 순서가 꼬이는 참사를 막기 위해 시간 스탬프 밀리초 기준 정방향 오름차순 조율을 감행합니다.
      .sort(
        (a, b) =>
          new Date(a.createdAt || 0).getTime() -
          new Date(b.createdAt || 0).getTime()
      )
  );
}
