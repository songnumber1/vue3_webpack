/**
 * @file adapters/modelAdapter.js
 * @description 백엔드 API 또는 Mock 시스템으로부터 수신된 원시 모델(Model) 데이터를 프론트엔드의 Chat 엔진, 스토어, 컴포넌트 뷰 레이어에서 다치지 않고 일관되게 다룰 수 있도록 정규화(Normalization)하는 어댑터 모듈입니다.
 *
 * 프리징 코드 주석 기준:
 * - 이 주석은 코드 추적을 돕기 위한 설명이며 런타임 동작을 변경하지 않습니다.
 * - 함수/상태가 다른 composable, store, component로 전달되는 경우 호출 방향을 먼저 확인하세요.
 */

import {MODEL_KEYS} from "@/constants/apiKeys";
import {toBoolean} from "@/utils/booleanUtils";

/**
 * @typedef {object} NormalizedModel
 * @property {string|number} id - LLM 모델의 고유 구별 자바스크립트 식별 아이디
 * @property {string|number} sourceId - 역추적성 확보를 위해 매핑 보존한 원본 데이터 ID
 * @property {string|number} assistId - 해당 모델과 부모-자식 관계로 결합된 소속 어시스턴트 고유 ID
 * @property {string} label - 드롭다운 메뉴 및 UI 스크린 출력용 친절 이름 명세 레이블
 * @property {string} name - LLM 모델 공식 명칭
 * @property {string} description - 모델의 파라미터 규모 및 성격 요약 설명 텍스트 (기본 포맷 제공)
 * @property {string} type - 모델 인프라 물리 인스턴스 분류 타입 구분자 (기본값: "instance")
 * @property {number} order - 모델 선택 목록 정렬 시 가중치를 연산할 시퀀스 인덱스 번호
 * @property {boolean} isAuthorized - 해당 사용자가 이 LLM 모델을 사용할 라이선스/인가 권한이 있는지 여부
 * @property {boolean} isDeleted - 원격지 서버 레이어에서 삭제(Soft Delete) 처리가 완료되었는지 여부
 * @property {boolean} isRecommended - 시스템 관리자가 추천하는 최적의 범용 고성능 모델 마킹 여부
 * @property {boolean} isNew - 최근 인프라에 추가 배포된 신규 고성능 엔트리 모델 마킹 여부
 * @property {boolean} isStudioModel - 프론트 유저가 커스텀 미세조정(Fine-Tuning) 등으로 개설한 스튜디오 전용 모델 여부
 * @property {boolean} hasImage - 멀티모달(Vision) 스펙을 지원하여 이미지 입력 컨텍스트 수용이 가능한지 여부
 * @property {boolean} hasRag - 벡터 검색 지식 뱅크(RAG) 파이프라인 연계 개통 지원 여부
 * @property {boolean} isReasoning - OpenAI o1 계열, DeepSeek R1 계열처럼 생각의 사슬(CoT) 추론 가동 프로세스를 동반하는 모델 유무
 * @property {object} raw - 후속 파싱 및 비즈니스 특수 조회를 위해 변형 없이 저장한 날것의 API 응답 원품 데이터 팩
 */

/**
 * @description 단일 LLM 원시 데이터 객체(Raw JSON)를 주입받아, 비정형 필드와 상이한 데이터 타입을 자바스크립트 논리 표준 규격에 충족하는 정형화 객체로 트랜스파일링합니다.
 * @param {object} [raw={}] - 백엔드 파이프라인 데이터베이스에서 전달된 원시 레코드 객체
 * @returns {NormalizedModel} 매핑 가공 작업이 엄격하게 완수된 어댑터 모델 본품
 */
export function adaptModel(raw = {}) {
  const id = raw[MODEL_KEYS.ID];
  const label = raw[MODEL_KEYS.NAME] || "Model"; // 데이터 누락 사태를 완화하기 위한 기본 폴백 타이틀 할당

  return {
    id,
    sourceId: id, // 원본 정합성 유지용 포인터
    assistId: raw[MODEL_KEYS.ASSISTANT_ID], // 상위 어시스턴트 구조와 정렬 매핑을 위한 외래키(FK) 정보 연계
    label,
    name: label,

    // 1. [설명란 조건부 가공] 백엔드 제공 명세서가 없을 경우 모델 유형을 파싱하여 가독성 높은 대체 한글 문구 자동 빌드
    description: raw.modelDesc || `${raw[MODEL_KEYS.TYPE] || "instance"} 모델`,
    type: raw[MODEL_KEYS.TYPE] || "instance",

    // 2. 우선순위 인덱싱 파싱: 유효 숫자가 존재하지 않는 Nullish 값 계열 유입 시 리스트 꼴찌(999)순위로 강제 하향 안착
    order: Number(raw[MODEL_KEYS.ORDER] ?? 999),

    // 3. 백엔드 문자열 변수 타입("Y"/"N", 1/0)을 프론트 브라우저 VM에 최적화된 순수 불리언(`true`/`false`)으로 일제히 정제
    isAuthorized: toBoolean(raw[MODEL_KEYS.AUTH_YN]), // 접근 제한 유무
    isDeleted: toBoolean(raw[MODEL_KEYS.DELETE_YN]), // 논리 삭제 유무
    isRecommended: toBoolean(raw.recommandYN), // 추천 엠블럼 점등 여부
    isNew: toBoolean(raw.newYN), // 신규 배포 엠블럼 점등 여부
    isStudioModel: toBoolean(raw.studioYN), // 파인튜닝 스튜디오 노드 유무
    hasImage: toBoolean(raw.imageYN), // 비전 멀티모달 인식 지원 유무
    hasRag: toBoolean(raw.ragYN), // 임베딩 지식 탐색 활성화 유무
    isReasoning: toBoolean(raw.isReasoning), // 추론형 LLM 아키텍처 여부

    // 원본 데이터 스냅샷을 포인터로 안착시켜 컴포넌트 특수 필드 파싱 및 로깅 확장성 보장
    raw,
  };
}

/**
 * @description 백엔드 모델 목록 리스트 통째를 정규화 변환(Map)하고, 관리자 권한 옵션 세팅에 맞춰 인가 상태 및 파기 데이터 노드를 선택적으로 분기 필터링합니다.
 * @param {Array<object>} [rawItems=[]] - 백엔드 통신 레이어에서 송신된 날것의 모델 객체 배열
 * @param {object} [options={}] - 목록 필터 스크리닝 관련 정밀 제어 옵션 팩
 * @param {boolean} [options.includeDeleted=false] - 소프트 삭제된 모델 레코드의 인라인 포함 노출 유무 플래그
 * @param {boolean} [options.includeUnauthorized=false] - 세션 유저에게 인가 권한이 없는 모델 노드의 인라인 포함 노출 유무 플래그
 * @returns {Array<NormalizedModel>} 비즈니스 정제 기준선에 완벽히 부합하여 컴포넌트 즉시 바인딩이 보장된 필터링 완료 배열 원본
 */
export function adaptModelList(rawItems = [], options = {}) {
  const {includeDeleted = false, includeUnauthorized = false} = options;

  return rawItems.map(adaptModel).filter((item) => {
    // 1. 코어 인프라 안전 가드: 필수 식별자인 고유 ID와 연결 부모 ID(assistId)가 하나라도 탈루된 손상 객체는 즉시 배제
    if (!item.id || !item.assistId) return false;

    // 2. 권한 검사 필터: 비인가 접근 숨김이 디폴트일 때, 권한이 상실된(`!isAuthorized`) 항목은 필터 탈락
    if (!includeUnauthorized && !item.isAuthorized) return false;

    // 3. 폐기물 스크리닝 필터: 삭제 항목 미포함이 디폴트일 때, 이미 파기 마킹된(`isDeleted`) 항목은 리스트에서 은닉
    if (!includeDeleted && item.isDeleted) return false;

    return true; // 상기 핵심 인프라 스크리닝 관문을 통과한 무결 노드 최종 수렴
  });
}

/**
 * @description [런타임 전용 퀵 가드] 이미 일차 가공이 완료되었거나 부분 정제된 범용 모델 풀(Pool) 안에서, 현재 즉시 구동 및 일반 채팅 진입이 보장되는 '순수 가용성' 모델만 완전 격리 정제하는 컴팩트 필터링 함수입니다.
 * @param {Array<NormalizedModel>} [models=[]] - 1차 어댑팅 변환 과정을 거쳤던 모델 집합군 배열
 * @returns {Array<NormalizedModel>} 즉시 대화 개통이 가용한 엄선된 청정 모델 리스트 배열
 */
export function filterAvailableModels(models = []) {
  return models.filter(
    // 락인(Lock-in) 핵심 4대 생존 조건: 고유 아이디 구비 + 부모 매핑 보장 + 접근 권한 승인 완료 + 논리 삭제 미발행
    (item) => item.id && item.assistId && item.isAuthorized && !item.isDeleted
  );
}
