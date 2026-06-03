/**
 * @file constants/api/apiRequestKeys.js
 * @description 프론트에서 백엔드로 전달하는 요청 payload/query 원본 key 모음입니다.
 */

export const API_REQUEST_KEYS = Object.freeze({
  CHAT_ID: "chatId",
  MESSAGE_ID: "msgId",
  RESPONSE_MESSAGE_ID: "respMsgId",
  ASSIST_ID: "assistId",
  ASSISTANT_ID: "assistantId",
  MODEL_ID: "modelId",
  LEGACY_MODEL_ID: "modeId",
  CHAT_TITLE: "chatTitle",
  INPUT: "input",
  BODY: "body",
  QUERY: "query",
  KEYWORD: "keyword",
  SEARCH_TEXT: "searchText",
  PAGE_NO: "pageNo",
  PAGE_PER_COUNT: "pagePerCnt",
  CATEGORY_ID: "categoryId",
  TOP_COUNT: "topCnt",
  USER_ID: "userId",
  USER_NAME: "userName",
  ENTRY_TYPE: "entryType",
  REQUEST_ID: "requestId",
  REQUEST_ID_SNAKE: "request_id",
  ARRAY_OPTIONS: "arrayOptions",
  UI_STATE_INFO_WRAPPER: "uiStateInfoWrapper",
  MESSAGE_FILE_HISTORY: "messageFileHist",
  SOURCE_TYPE: "sourceType",
  STUDIO: "studio",
  INTENTION: "intention",
  RAG: "rag",
  RAG_COT: "ragCot",
  IMAGE_S3_PATH: "imageS3Path",
  IMAGE_S3_PATH_LEGACY: "imgS3Path",
});

export default API_REQUEST_KEYS;
