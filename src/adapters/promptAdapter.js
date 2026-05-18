/**
 * @description adaptExamplePrompt 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {*} raw - raw 입력값입니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
export function adaptExamplePrompt(raw = {}) {
  return {
    id: raw.question_id,
    assistId: raw.assist_id,
    titleKo: raw.example_view_kr || raw.example_content_kr || "",
    titleEn: raw.example_view_en || raw.example_content_en || "",
    contentKo: raw.example_content_kr || raw.example_view_kr || "",
    contentEn: raw.example_content_en || raw.example_view_en || "",
    categoryKo: raw.question_category_name_ko || "",
    categoryEn: raw.question_category_name_en || "",
    hasRag: Boolean(raw.rag_yn),
    raw,
  };
}

/**
 * @description adaptExamplePromptList 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {*} response - response 입력값입니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
export function adaptExamplePromptList(response = {}) {
  return (response.list || [])
    .map(adaptExamplePrompt)
    .filter((item) => item.id);
}
