/**
 * @file adapters/promptAdapter.js
 * @description 백엔드 API 또는 Mock 시스템으로부터 수신된 추천 질문 데이터(Example Prompt) 및 프롬프트 서식(Prompt Template) 원시 응답을 프론트엔드의 작곡기(Composer), 스토어, 화면 컴포넌트 레이어에서 안전하게 소비할 수 있도록 정규화(Normalization)하는 어댑터 모듈입니다.
 *
 * 프리징 코드 주석 기준:
 * - 이 주석은 코드 추적을 돕기 위한 설명이며 런타임 동작을 변경하지 않습니다.
 * - 함수/상태가 다른 composable, store, component로 전달되는 경우 호출 방향을 먼저 확인하세요.
 */

import {PROMPT_TEMPLATE_MODEL_IDS} from "@/constants/promptComposer";

/**
 * @typedef {object} NormalizedExamplePrompt
 * @property {string|number} id - 추천 예시 질문 고유 식별 코드 ID
 * @property {string|number} assistId - 결합 연계된 부모 어시스턴트 고유 참조 외래키 ID
 * @property {string} titleKo - UI 리스트 타일 목록 칩에 출력할 국문 노출명 (상호보완 폴백 적용)
 * @property {string} titleEn - UI 리스트 타일 목록 칩에 출력할 영문 노출명 (상호보완 폴백 적용)
 * @property {string} contentKo - 칩을 클릭했을 때 실제 채팅창 인풋 박스에 복사 주입될 국문 텍스트 본문 원품
 * @property {string} contentEn - 칩을 클릭했을 때 실제 채팅창 인풋 박스에 복사 주입될 영문 텍스트 본문 원품
 * @property {string} categoryKo - 템플릿 정렬용 카테고리 분류 한글 식별 명칭 (예: "업무", "일상")
 * @property {string} categoryEn - 템플릿 정렬용 카테고리 분류 영문 식별 명칭 (예: "Work", "Daily")
 * @property {boolean} hasRag - 해당 예시 질문이 지식 베이스 검색(RAG) 파이프라인 연동 가동을 필수 전제하는지 여부
 * @property {object} raw - 후속 역추적 및 예외 상황 유연 대응을 위해 무가공 동기화한 백엔드 원품 레코드 팩
 */

/**
 * @description 단일 추천 예시 질문 객체(Raw JSON)를 주입받아, 필드 유실 사태를 상호 교차 방어(Cross-Fallback)하면서 프론트엔드 전용 질문 모델 규격으로 변환 정제합니다.
 * @param {object} [raw={}] - 백엔드 API 엔진에서 전달된 단일 예시 질문 원시 객체
 * @returns {NormalizedExamplePrompt} 뷰 컴포넌트에 즉각 파인딩 가능한 안전 규격 예시 질문 객체
 */
export function adaptExamplePrompt(raw = {}) {
  return {
    id: raw.question_id,
    assistId: raw.assist_id,

    // [상호 교차 방어 가드] 노출용 짧은 제목(view)과 인풋 주입용 상세 본문(content) 중 하나가 누락되어 인입되더라도,
    // 유저 화면 상에서 엑스박스나 빈 텍스트 현상으로 레이아웃이 붕괴하는 것을 막기 위해 상호 대체 폴백을 수립합니다.
    titleKo: raw.example_view_kr || raw.example_content_kr || "",
    titleEn: raw.example_view_en || raw.example_content_en || "",
    contentKo: raw.example_content_kr || raw.example_view_kr || "",
    contentEn: raw.example_content_en || raw.example_view_en || "",

    categoryKo: raw.question_category_name_ko || "",
    categoryEn: raw.question_category_name_en || "",

    // 백엔드의 플래그 형태 변수를 자바스크립트 표준 런타임에 호환되는 논리 원시 불리언(`true`/`false`)으로 엄격 가공
    hasRag: Boolean(raw.rag_yn),

    // 원본 데이터 참조 링크 보존
    raw,
  };
}

/**
 * @description API의 리스트 컨테이너 응답 결과 구조체를 안전 분해하여 전 엔트리를 정규화 변환(Map)하고, 필수 식별자인 고유 ID가 결락된 불량 파손 노드를 탈거 청소(Filter)합니다.
 * @param {object} [response={}] - 리스트 및 메타 필드를 래핑한 원시 팩 묶음 응답 객체
 * @returns {Array<NormalizedExamplePrompt>} 세정 및 변환이 완수되어 즉시 컴포넌트 바인딩이 보장된 추천 질문 리스트 배열
 */
export function adaptExamplePromptList(response = {}) {
  // 응답 본체 내부에 .list 컨테이너 레이어가 실종되었을 때를 대비한 Nullish 코어 안전 보장 구조 개통
  return (response.list || [])
    .map(adaptExamplePrompt) // 1차 파이프라인: 전 레코드 정규화 모델 전환
    .filter((item) => item.id); // 2차 파이프라인: 식별자가 결손되어 화면 제어가 불가능한 좀비 오브젝트 즉각 필터 축출
}

/**
 * @description 인입된 템플릿의 가변적인 백엔드 명칭 문자열들을 스캔 및 소문자 정형화 처리하여, 프론트엔드가 내부 CSS 클래스 바인딩이나 아이콘 에셋 매핑 스위치 조건문으로 활용할 수 있는 "고유 식별 시스템 키"로 환원 도출합니다.
 * @param {object} [raw={}] - 백엔드에서 전달받은 원시 템플릿 객체 레코드 본체
 * @returns {string} 프론트엔드 조건부 분기 트리거용 정형화 슬러그 키 키워드 (예: "mail", "translate", "custom-slug")
 */
function resolveTemplateKey(raw = {}) {
  // 백엔드가 하이드레이션하는 다중 네이밍 속성 후보군(Snake, Camel 등)을 순차 탐색 수집한 후 일괄 소문자 파싱
  const name = String(
    raw.promptTemplateName ||
      raw.name_ko ||
      raw.name_en ||
      raw.nameKo ||
      raw.nameEn ||
      ""
  ).toLowerCase();

  // 프론트엔드 비즈니스 코어와 약속된 상징 키워드 정렬 맵핑 분기망 가동
  if (["메일", "mail", "email"].includes(name)) return "mail";
  if (["번역", "translate", "translation"].includes(name)) return "translate";
  if (["요약", "summary", "summarize"].includes(name)) return "summary";
  if (["코드", "code"].includes(name)) return "code";
  if (["직접입력", "direct input"].includes(name)) return "direct";

  // 정형 키워드 맵핑 풀에 부합하지 않는 커스텀 템플릿 이름일 경우, 공백 및 띄어쓰기를 대시(-) 기호로 치환하여 웹 표준 슬러그(Slug) 코드로 안전 변환
  return name.replace(/\s+/g, "-");
}

/**
 * @typedef {object} NormalizedPromptTemplate
 * @property {string|number} id - 프롬프트 서식 고유 제어 아이디 식별자
 * @property {string} modelId - 해당 템플릿이 구속 연동되어 적용될 LLM 모델 고유 식별 코드
 * @property {string} key - 프론트엔드 내부 테마 CSS/아이콘 매핑용 정형 슬러그 식별 키 (`resolveTemplateKey` 연산 결과)
 * @property {number} order - 프롬프트 작성기 탭 바에서 템플릿이 배치될 정렬 우선순위 인덱스 번호
 * @property {boolean} default - 첫 진입 시 자동으로 탭 활성화를 켜줄 기본 디폴트 템플릿 설정 여부 플래그
 * @property {string} nameKo - 템플릿 탭 타이틀 국문 출력 명칭
 * @property {string} nameEn - 템플릿 탭 타이틀 영문 출력 명칭
 * @property {string} descKo - 유저 인풋 입력을 돕기 위한 작성 서식 한글 안내 가이드라인 플레이스홀더 텍스트
 * @property {string} descEn - 유저 인풋 입력을 돕기 위한 작성 서식 영문 안내 가이드라인 플레이스홀더 텍스트
 * @property {string} templateName - 원천 식별용 통합 템플릿 명칭
 * @property {object} template - 시스템 프롬프트 가공에 바인딩될 룰셋 파라미터 컨테이너 메인 구조체
 * @property {object} raw - 후속 파싱 및 확장 디버깅을 위해 보존해 둔 무가공 순수 응답 데이터 백품
 */

/**
 * @description 단일 프롬프트 템플릿 원시 레코드를 가공하여 다중 키 누락을 방어하고, UI 조작용 메타 필드가 완전 내장된 표준 프롬프트 서식 구조체로 리모델링합니다.
 * @param {object} [raw={}] - 백엔드 파이프라인에서 인입된 단일 템플릿 로우 데이터
 * @returns {NormalizedPromptTemplate} 정형화 매핑이 처리된 프론트엔드 최적화형 단일 템플릿 객체
 */
export function adaptPromptTemplate(raw = {}) {
  // 백엔드 명세 변경이나 시스템별 키 구조 상이(Snake vs Camel vs Nested) 사태를 방어하기 위한 통합 Nullish 연산 개통
  const id = raw.prompts_id || raw.id || raw.promptTemplateId || "";
  const modelId = raw.model_id || raw.modelId || "";
  const template = raw.promptTemplate || {};

  return {
    id,
    modelId,
    key: resolveTemplateKey(raw), // 뷰 레이어 에셋 싱크용 문자열 가공 키 할당

    // 순서 정렬 가중치 정수 파싱: 수치 유실 시 가장 마지막 순번(999)으로 안전 슬라이딩 처리
    order: Number(raw.promptTemplateOrder ?? raw.order ?? 999),
    default: Boolean(raw.default),

    // 다중 명세 대응형 다국어 텍스트 필드 정제 파이프라인 수립
    nameKo: raw.name_ko || raw.nameKo || raw.promptTemplateName || "",
    nameEn: raw.name_en || raw.nameEn || raw.promptTemplateName || "",
    descKo: raw.desc_ko || raw.descKo || "",
    descEn: raw.desc_en || raw.descEn || "",

    templateName: raw.promptTemplateName || raw.name_ko || raw.name_en || "",
    template,

    // 원본 데이터 참조 앵커 포인터 보존
    raw,
  };
}

/**
 * @description 다양한 포맷(단순 배열 또는 객체 래핑 리스트)으로 파괴되어 들어오는 템플릿 응답 본체를 무결성 진단하여 일괄 매핑(Map)하고, 시스템 지원 허용 모델 여부 판정 및 정렬(Sort) 순서 동기화까지 통합 집행하는 오케스트레이터 허브 함수입니다.
 * @param {object|Array} [response={}] - 백엔드에서 반환된 원시 응답 JSON 또는 원시 배열 본체
 * @returns {Array<NormalizedPromptTemplate>} 정제, 검증, 필터링, 정렬 관문을 모두 통과하여 즉시 랜더링 버스에 탑승 가용한 최정예 템플릿 리스트 완품 배열
 */
export function adaptPromptTemplateList(response = {}) {
  // 1. [구조적 폴백 처리] 응답 데이터 자체가 순수 배열일 때와 특정 레코드 필드에 싸여 있을 때를 교차 진단하여 안전하게 타깃 배열 풀을 적출
  const list = Array.isArray(response)
    ? response
    : response.list || response.prompts || [];

  return (
    list
      .map(adaptPromptTemplate) // 파이프라인 1단계: 전 엔트리 모델 구조 정문화 전환
      .filter((item) => item.id) // 파이프라인 2단계: 핵심 컨트롤러 키인 고유 아이디가 부재하는 유령 노드 즉각 숙청

      // 파이프라인 3단계: [화이트리스트 보안 스크리닝] 특정 모델 종속성이 선언되어 있는 경우, 프론트 컴포저 상수(`PROMPT_TEMPLATE_MODEL_IDS`)에 등록되어 인가된 핵심 모델인지 대조하여 통과 분기 처리
      .filter(
        (item) =>
          !item.modelId || PROMPT_TEMPLATE_MODEL_IDS.includes(item.modelId)
      )

      // 파이프라인 4단계: [순서 수직 동기화] 어댑팅 과정에서 부여된 오더 정수 스케일을 기반으로 오름차순(ASC) 배치 정렬을 수행하여 UI 안정성 완수
      .sort((a, b) => a.order - b.order)
  );
}
