/**
 * @file adapters/assistantAdapter.js
 * @description 백엔드 API API 또는 Mock 레이어의 원본 응답 구조를 프론트엔드 뷰(View) 및 스토어(Store) 레이어에서 일관되게 소비할 수 있도록 정규화(Normalization)하는 어댑터 가공 모듈입니다.
 *
 * 프리징 코드 주석 기준:
 * - 이 주석은 코드 추적을 돕기 위한 설명이며 런타임 동작을 변경하지 않습니다.
 * - 함수/상태가 다른 composable, store, component로 전달되는 경우 호출 방향을 먼저 확인하세요.
 */

import {ASSISTANT_API_KEYS as ASSISTANT_KEYS} from "@/constants/api/assistantApiKeys";
import {ASSISTANT_TYPES} from "@/constants/domain";
import {toBoolean} from "@/utils/booleanUtils";
import {DEFAULT_ASSISTANT_IMAGE} from "@/constants/assistantImages";

/**
 * @description 백엔드 응답 객체에 담긴 다양한 이미지 포맷 데이터(단순 문자열 주소 또는 중첩 객체 형태)를 정밀 스캔하여 유효한 이미지 URL 경로를 추출해내는 방어적 유틸리티 함수입니다.
 * @param {object} raw - API 결과 원본 객체 또는 특정 이미지 데이터 블록
 * @param {string} key - `ASSISTANT_KEYS`에 맵핑된 특정 해상도별 이미지 탐색 키 정보
 * @param {string} fallback - 해당 데이터가 유실되었거나 형식이 맞지 않을 경우 대체할 기본 시스템 에셋 이미지 경로
 * @returns {string} 최종 연산 확정된 단일 이미지 웹 리소스 주소 URL
 */
function resolveAssistantImage(raw, key, fallback) {
  // 인입된 원시 데이터 팩으로부터 지정된 고유 API 식별 키값 파싱
  const value = raw?.[key];

  // 케이스 A: 이미 완성형 이미지 URL 문자열 스트링(String) 포맷으로 전달되었고 빈 값이 아닐 경우 그대로 인가
  if (typeof value === "string" && value) return value;

  // 케이스 B: 네이티브 패키지 내보내기 덤프 혹은 하이브리드 미디어 객체 형태로 `{ path: "url" }` 구조를 띄고 있을 경우 내부 주소 추출
  if (value?.path) return value.path;

  // 케이스 C: 상기 조건이 모두 불일치하거나 유실된 데이터일 경우 시스템 기본 준비물 이미지 경로(Fallback)를 강제 바인딩
  return fallback;
}

/**
 * @typedef {object} NormalizedAssistant
 * @property {string|number} id - 어시스턴트 고유 구별 아이디 식별자
 * @property {string|number} sourceId - 추적용 원본 엔티티 매핑 ID
 * @property {string} type - 시스템 도메인 분류 코드 (STUDIO | ASSISTANT)
 * @property {string} label - 화면 UI 레이블 출력용 네임스페이스
 * @property {string} name - 어시스턴트 공식 명칭
 * @property {string} description - 비즈니스 분류 가이드라인 설명란 문구
 * @property {number} order - UI 리스트 내부 정렬 가중치 우선순위 시퀀스 번호
 * @property {boolean} isStudio - 커스텀 사용자 정의 스튜디오 에이전트 빌드 여부 플래그
 * @property {boolean} isAuthorized - 해당 유저 세션의 접근/사용 허가 권한 상태 플래그
 * @property {boolean} isDeleted - 원격 데이터베이스 레이어 논리 삭제 상태 처리 마킹 플래그
 * @property {boolean} isFixed - 사이드바 혹은 퀵메뉴 상단 영구 고정 상태 유무 플래그
 * @property {boolean} isPrivate - 비공개/퍼블릭 공유 제한 격리 수준 상태 플래그
 * @property {boolean} hasRag - 벡터 임베딩 문서 기반의 RAG 컨텍스트 서칭 스코프 장착 여부 플래그
 * @property {string} Image48Src - 대형 컴포넌트용 48px 해상도 썸네일 이미지 소스
 * @property {string} image20Src - 중형 리스트용 20px 해상도 썸네일 이미지 소스
 * @property {string} image16Src - 인라인 챗 뱃지용 16px 해상도 썸네일 이미지 소스
 * @property {object} raw - 역추적 및 예외 상황 핸들링을 위해 보존해 둔 순수 원본 백엔드 데이터 팩 원품
 */

/**
 * @description 단일 어시스턴트 원시 객체(Raw JSON)를 수임받아, 프론트엔드 전반(Pinia Store, Vue Component)에서 엄격하고 일관되게 다룰 수 있는 불변식 정규화 모델로 재조립 변환합니다.
 * @param {object} [raw={}] - 백엔드에서 반환된 날것의 단일 레코드 객체
 * @returns {NormalizedAssistant} 프론트엔드 전용 규격 타입으로 매핑이 완료된 어시스턴트 객체
 */
export function adaptAssistant(raw = {}) {
  // 문자열 형태의 백엔드 불리언 대용 부호("Y"/"N", 1/0 등)를 자바스크립트 가상 머신에 최적화된 논리 원시값(`true`/`false`)으로 전격 안전 파싱
  const isStudio = toBoolean(raw[ASSISTANT_KEYS.STUDIO_YN]);
  const isMcp = toBoolean(raw.mcpYN || raw.MCP_YN || raw.mcp_yn);
  const id = raw[ASSISTANT_KEYS.ID];
  const name = raw[ASSISTANT_KEYS.NAME] || "Assistant"; // 데이터 유실 사태 대비 폴백 타이틀 지정

  return {
    id,
    sourceId: id, // 원본 소스추적성 보존을 위한 미러링 바인딩

    // 1. 도메인 유형 정형화: 스튜디오 모드 여부에 맞게 미리 정의된 도메인 상수(Enums) 바인딩 수립
    type: isMcp
      ? ASSISTANT_TYPES.MCP
      : isStudio
        ? ASSISTANT_TYPES.STUDIO
        : ASSISTANT_TYPES.ASSISTANT,
    label: name,
    name,

    // 2. [설명란 문구 조건부 분기 정의] 백엔드가 주지 않는 뷰 레이어 전용 친절 가이드 메시지를 조건식에 매칭하여 동적 주입
    description: isMcp
      ? "MCP Connector를 탐색하고 구독할 수 있습니다."
      : isStudio
        ? "사용자 정의 Studio Assistant"
        : toBoolean(raw[ASSISTANT_KEYS.RAG_YN])
          ? "RAG 기반 질의응답 Assistant"
          : "일반 질의응답 Assistant",

    // 3. 우선순위 정렬 인덱스 정수 파싱: 수치화할 수 없는 데이터가 올 경우 정렬 순위 최하위권(999)으로 안전 밀어내기 처리
    order: Number(raw[ASSISTANT_KEYS.ORDER] ?? 999),
    isStudio,

    // 4. 비즈니스 상태값 원시화 트랜스파일링
    isAuthorized: toBoolean(raw[ASSISTANT_KEYS.AUTH_YN]), // 접근 인가 유무
    isDeleted: toBoolean(raw[ASSISTANT_KEYS.DELETE_YN]), // 데이터 파기 유무
    isFixed: toBoolean(raw[ASSISTANT_KEYS.FIX_YN]), // 상단 핀 고정 유무
    isPrivate: toBoolean(raw[ASSISTANT_KEYS.PRIVATE_YN]), // 비공개 워크스페이스 유무
    hasRag: toBoolean(raw[ASSISTANT_KEYS.RAG_YN]), // 지식 베이스 검색 연동 유무

    // 5. [해상도별 이미지 파이프라인 개통] 헬퍼 함수를 통한 방어적 해독 및 캐싱 주소 할당 단행
    Image48Src: resolveAssistantImage(
      raw,
      ASSISTANT_KEYS.IMAGE_48_SRC,
      DEFAULT_ASSISTANT_IMAGE.Image48Src
    ),
    image20Src: resolveAssistantImage(
      raw,
      ASSISTANT_KEYS.IMAGE_20_SRC,
      DEFAULT_ASSISTANT_IMAGE.image20Src
    ),
    image16Src: resolveAssistantImage(
      raw,
      ASSISTANT_KEYS.IMAGE_16_SRC,
      DEFAULT_ASSISTANT_IMAGE.image16Src
    ),

    // 추후 디버깅 및 특정 컴포넌트에서 원본 전용 특수 필드를 조회해야 하는 경우를 대비해 원본 참조 포인터를 박아둠
    raw,
  };
}

/**
 * @description API 리스트 응답 결과 배열 전체를 일괄 변환(Map)하고, 화면에 노출되기에 부적합한 유실 항목, 비인가 권한 항목, 논리 삭제된 노드들을 사전에 차단 필터링(Filter)하는 오케스트레이션 함수입니다.
 * @param {Array<object>} [rawItems=[]] - 백엔드 파이프라인에서 수신된 원시 어시스턴트 리스트 배열
 * @returns {Array<NormalizedAssistant>} 인가 및 클렌징 처리가 완료되어 UI 컴포넌트에 즉시 바인딩이 가능한 정형화 배열 리스트
 */
export function adaptAssistantList(rawItems = []) {
  return (
    rawItems
      .map(adaptAssistant) // 1차 파이프라인: 전 레코드 모델 정규화 매핑 전환
      // 2차 파이프라인 (보안 및 데이터 정제 망): 아이디 식별자가 존재하지 않거나, 현재 유저 세션에 접근 권한이 없거나, 이미 데이터베이스에서 지워진 어시스턴트는 화면 표출 후보군에서 영구 격리 배제
      .filter((item) => item.id && item.isAuthorized && !item.isDeleted)
  );
}
