/**
 * @file api/mock/data/examplePrompts.raw.js
 * @description 개발/데모용 mock API 또는 mock 데이터입니다. 실제 API 비활성화 시 화면 동작을 보장합니다.
 *
 * 프리징 코드 주석 기준:
 * - 이 주석은 코드 추적을 돕기 위한 설명이며 런타임 동작을 변경하지 않습니다.
 * - 함수/상태가 다른 composable, store, component로 전달되는 경우 호출 방향을 먼저 확인하세요.
 */

const prompt = (assistId, index, kr, en, options = {}) => ({
  question_category_name_en: options.categoryEn || "General",
  example_view_kr: kr,
  example_view_en: en,
  class_type: options.classType || `sample-${String(index).padStart(2, "0")}`,
  rag_yn: Boolean(options.rag),
  example_content_en: options.contentEn || en,
  example_content_kr: options.contentKr || kr,
  question_category_name_ko: options.categoryKo || "일반",
  assist_id: assistId,
  question_id: `${assistId}-question-${index}`,
});

export const EXAMPLE_PROMPTS_RAW = {
  "assist-ds": {
    list: [
      prompt(
        "assist-ds",
        1,
        "Vue와 Spring Boot 연동 구조를 점검해줘",
        "Review Vue and Spring Boot integration"
      ),
      prompt(
        "assist-ds",
        2,
        "모바일 WebView에서 발생 가능한 이슈를 정리해줘",
        "List possible mobile WebView issues"
      ),
      prompt(
        "assist-ds",
        3,
        "API 응답 adapter 설계를 제안해줘",
        "Suggest an API response adapter design"
      ),
      prompt(
        "assist-ds",
        4,
        "운영 배포 전 체크리스트를 만들어줘",
        "Create a production release checklist"
      ),
      prompt(
        "assist-ds",
        5,
        "Promise.all 초기 데이터 로딩 구조를 설명해줘",
        "Explain Promise.all bootstrap loading"
      ),
      prompt(
        "assist-ds",
        6,
        "Pinia store 분리 기준을 알려줘",
        "Explain Pinia store separation"
      ),
    ],
  },
  "assist-code": {
    list: [
      prompt(
        "assist-code",
        1,
        "이 Vue 컴포넌트를 Composition API 기준으로 리팩토링해줘",
        "Refactor this Vue component"
      ),
      prompt(
        "assist-code",
        2,
        "axios interceptor 예외 처리를 점검해줘",
        "Review axios interceptor error handling"
      ),
      prompt(
        "assist-code",
        3,
        "중복 로직을 composable로 분리해줘",
        "Extract duplicated logic into composables"
      ),
      prompt(
        "assist-code",
        4,
        "ESLint 오류를 기준으로 수정 포인트를 알려줘",
        "Find fixes by ESLint errors"
      ),
    ],
  },
  "assist-arch": {
    list: [
      prompt(
        "assist-arch",
        1,
        "Container, Business, Adapter 계층을 설계해줘",
        "Design container business adapter layers"
      ),
      prompt(
        "assist-arch",
        2,
        "운영 API를 유지한 채 프론트 구조를 개선해줘",
        "Improve frontend while preserving backend API"
      ),
      prompt(
        "assist-arch",
        3,
        "모듈 경계와 import 방향을 정리해줘",
        "Define module boundaries and imports"
      ),
    ],
  },
  "assist-writing": {
    list: [
      prompt(
        "assist-writing",
        1,
        "고객에게 전달할 요구사항 문서를 정리해줘",
        "Rewrite a customer requirement document"
      ),
      prompt(
        "assist-writing",
        2,
        "공지사항 문구를 더 자연스럽게 바꿔줘",
        "Improve notice wording"
      ),
      prompt(
        "assist-writing",
        3,
        "기술 리스크를 공격적이지 않게 표현해줘",
        "Phrase technical risks neutrally"
      ),
      prompt(
        "assist-writing",
        4,
        "커밋 메시지를 깔끔하게 작성해줘",
        "Write a clear commit message"
      ),
      prompt(
        "assist-writing",
        5,
        "회의 공유용 요약본을 만들어줘",
        "Create a meeting summary"
      ),
    ],
  },
  "assist-data": {
    list: [
      prompt(
        "assist-data",
        1,
        "표 데이터를 요약하고 이상치를 찾아줘",
        "Summarize table data and find outliers"
      ),
      prompt(
        "assist-data",
        2,
        "CSV 다운로드 UX를 검토해줘",
        "Review CSV download UX"
      ),
      prompt(
        "assist-data",
        3,
        "차트로 보여줄 지표를 추천해줘",
        "Recommend metrics for charts"
      ),
    ],
  },
  "studio-marketing": {
    list: [],
  },
  "studio-ops": {
    list: [
      prompt(
        "studio-ops",
        1,
        "CLOSE_WAIT 장애 원인 후보를 정리해줘",
        "List CLOSE_WAIT incident causes"
      ),
      prompt(
        "studio-ops",
        2,
        "Grafana 지표 기반 점검 순서를 만들어줘",
        "Create a Grafana triage checklist"
      ),
      prompt(
        "studio-ops",
        3,
        "Linux 커널 튜닝 항목을 설명해줘",
        "Explain Linux kernel tuning items"
      ),
      prompt(
        "studio-ops",
        4,
        "장애 보고서 초안을 만들어줘",
        "Draft an incident report"
      ),
    ],
  },
};
