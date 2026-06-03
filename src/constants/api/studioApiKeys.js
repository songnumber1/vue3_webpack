/**
 * @file constants/api/studioApiKeys.js
 * @description Studio/Assistant 생성 화면에서 사용하는 API 원본 key 모음입니다.
 */

export const STUDIO_API_KEYS = Object.freeze({
  SYS_INFO_LIST: "sysInfoList",
  STUDIO_MODEL_LIST: "studioModelList",
  RAG_DATA_LIST: "ragDataList",
  MCP_PLUGIN_LIST: "mcpPluginList",
  ACCESS_INFO: "accessInfo",

  STUDIO_ID: "studio_id",
  STUDIO_ID_LEGACY_TYPO: "sutdio_id",
  STUDIO_NAME: "studio_name",
  STUDIO_DESC: "studio_desc",
  STUDIO_CATEGORY_CODE: "studio_cat_code",
  STUDIO_CATEGORY_USE_YN: "studio_cat_use_yn",
  STUDIO_CATEGORY_NAME_KO: "studio_cat_name_ko",
  STUDIO_CATEGORY_NAME_EN: "studio_cat_name_en",
  STUDIO_CATEGORY_DESC_KO: "studio_cat_desc_ko",
  STUDIO_CATEGORY_DESC_EN: "studio_cat_desc_en",
  STUDIO_LIKE_COUNT: "studio_like_cnt",
  STUDIO_WATCH_COUNT: "studio_watch_cnt",
  STUDIO_MEMBER_YN: "studio_member_yn",
  STUDIO_PRIVATE_YN: "studio_private_yn",
  STUDIO_OWNER_YN: "reg_yn",
  STUDIO_AUTH_ARRAY: "assist_ssg_auth_arr",

  CAMEL_STUDIO_ID: "studioId",
  CAMEL_STUDIO_NAME: "studioName",
  CAMEL_STUDIO_CATEGORY_CODE: "studioCatCode",
  CAMEL_STUDIO_YN: "studioYN",
  CAMEL_STUDIO_LIKE_COUNT: "likeCnt",

  ASSIST_ID: "assistId",
  ASSIST_NAME: "assistName",
  ASSIST_ORDER: "assistOrder",
  AUTH_YN: "authYN",
  DELETE_YN: "delYN",
  FIX_YN: "fixYN",
  FILE_YN: "fileYN",
  RAG_YN: "ragYN",
  SHARED_STUDIO_YN: "sharedStudioYN",
  SHARED_STUDIO_YN_LEGACY_TYPO: "shardStudioYN",
  PRIVATE_YN: "privateYN",

  MODEL_ID: "model_id",
  MODEL_ID_CAMEL: "modelId",
  MODEL_NAME: "model_name",
  MODEL_NAME_CAMEL: "modelName",
  MODEL_DESC: "model_desc",
  MODEL_DESC_KO: "model_desc_ko",
  MODEL_DESC_EN: "model_desc_en",
  MODEL_TYPE: "ModelType",
  CONN_MODEL_ID: "connModelId",
  CONN_MODEL_NAME: "conn_model_name",

  RAG_ID: "rag_id",
  RAG_NAME: "rag_name",
  RAG_DESC: "rag_desc",
  MCP_ID: "mcp_id",
  MCP_NAME: "mcp_name",
  MCP_DESC: "mcp_desc",

  USER_ID: "user_id",
  USER_NAME: "user_name",
  REG_USER_ID: "regUserId",
  IMAGE_48_SRC: "Image48Src",
  IMAGE_20_SRC: "image20Src",
  IMAGE_16_SRC: "image16Src",
});

export default STUDIO_API_KEYS;
