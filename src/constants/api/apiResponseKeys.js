/**
 * @file constants/api/apiResponseKeys.js
 * @description Axios/API wrapper 응답에서 반복되는 공통 원본 key 모음입니다.
 * 기존 constants/apiConfig.js의 API_KEYS는 요청 정책용이므로 이 파일에서는 RESPONSE 전용 이름을 사용합니다.
 */

export const API_RESPONSE_KEYS = Object.freeze({
  DATA: "data",
  RESULT: "result",
  BODY: "body",
  LIST: "list",
  RESULT_LIST: "resultList",
  ITEMS: "items",
  ROWS: "rows",
  SUCCESS: "success",
  VALID: "valid",
  OK: "ok",
  CODE: "code",
  MESSAGE: "message",
  ERROR: "error",
  ERROR_CODE: "errorCode",
  ERROR_MESSAGE: "errorMessage",
  STATUS: "status",
  TYPE: "type",
  PATH: "path",
  KEYWORD: "keyword",
  SUGGESTIONS: "suggestions",
  PAGE_NO: "page_no",
  MAX_PAGE_NO: "max_page_no",
  ALL_COUNT: "all_count",
  SEARCH_ALL_COUNT: "search_all_count",
  USER_COUNT: "user_count",
  SEARCH_USER_COUNT: "search_user_count",
  TOTAL_COUNT: "totalCount",
  PAGE: "page",
  SIZE: "size",
});

export default API_RESPONSE_KEYS;
