/**
 * 메인 화면에 출력할 Assistant/Studio 예시 프롬프트 최대 개수입니다.
 *
 * 특징:
 * - 실제 문구는 example-prompts API/mock 데이터에서 가져옵니다.
 * - 이 값을 3에서 4로 변경하면 Assistant별 프롬프트 중 앞 4개가 출력됩니다.
 * - 고정 카테고리 라벨/프롬프트를 사용하지 않아 Assistant 변경 시 fallback 문구 깜박임을 방지합니다.
 *
 * @type {number}
 */
export const PROMPT_SUGGESTION_LIMIT = 5;
