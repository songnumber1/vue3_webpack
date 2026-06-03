/**
 * @file adapters/studioResponseAdapter.js
 * @description Studio API 원본 응답 key 접근을 한 곳으로 모아 화면용 모델로 정규화합니다.
 */

import {STUDIO_API_KEYS as S} from "@/constants/api/studioApiKeys";
import {readFirstDefined, unwrapApiBody} from "@/utils/apiResponseReader";

function toArray(value) {
  return Array.isArray(value) ? value : [];
}

function readRaw(source, keys = [], fallback = undefined) {
  return readFirstDefined(source, keys, fallback);
}

function readString(source, keys = [], fallback = "") {
  const value = readRaw(source, keys, fallback);
  if (value === undefined || value === null) return fallback;
  return String(value);
}

function readNumber(source, keys = [], fallback = 0) {
  const value = readRaw(source, keys, fallback);
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function readBoolean(source, keys = []) {
  const value = readRaw(source, keys, false);
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    return ["true", "y", "yes", "1"].includes(normalized);
  }
  return Boolean(value);
}

export function parseFirstStudioModelName(value) {
  if (Array.isArray(value)) return value[0] || "";
  if (typeof value !== "string") return "";
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) return parsed[0] || "";
  } catch (error) {
    return value
      .replace(/\[|\]|"/g, "")
      .split(",")[0]
      ?.trim() || "";
  }
  return value;
}

export function adaptStudioCategory(item = {}, options = {}) {
  const {allValue = "ALL", allLabel = "All", allDescription = ""} = options;
  const value = readString(item, [S.STUDIO_CATEGORY_CODE], allValue);
  return {
    value,
    label: readString(
      item,
      [S.STUDIO_CATEGORY_NAME_KO, S.STUDIO_CATEGORY_NAME_EN, S.STUDIO_CATEGORY_CODE],
      allLabel
    ),
    description: readString(
      item,
      [S.STUDIO_CATEGORY_DESC_KO, S.STUDIO_CATEGORY_DESC_EN],
      allDescription
    ),
  };
}

export function adaptStudioCategories(items = [], options = {}) {
  const categories = toArray(items)
    .filter((item) => readRaw(item, [S.STUDIO_CATEGORY_USE_YN], true) !== false)
    .map((item) => adaptStudioCategory(item, options))
    .filter((item) => item.value);

  const allValue = options.allValue || "ALL";
  if (!categories.some((item) => item.value === allValue)) {
    categories.unshift({
      value: allValue,
      label: options.allLabel || "All",
      description: options.allDescription || "",
    });
  }

  return categories;
}

export function adaptStudioModelOption(item = {}) {
  return {
    value: readString(item, [S.MODEL_ID, S.MODEL_ID_CAMEL, S.MODEL_NAME, S.MODEL_NAME_CAMEL]),
    label: readString(item, [S.MODEL_NAME, S.MODEL_NAME_CAMEL, S.MODEL_ID, S.MODEL_ID_CAMEL]),
    description: readString(item, [S.MODEL_DESC_KO, S.MODEL_DESC_EN, S.MODEL_DESC]),
  };
}

export function adaptStudioModelOptions(items = []) {
  return toArray(items).map(adaptStudioModelOption).filter((item) => item.value || item.label);
}

export function adaptStudioSimpleOption(item = {}, keys = []) {
  if (typeof item === "string") return item;
  return readString(item, keys, "");
}

export function adaptStudioRagOptions(items = []) {
  return toArray(items)
    .map((item) =>
      adaptStudioSimpleOption(item, [S.LABEL, S.NAME, S.ID, S.RAG_NAME, S.RAG_ID, S.RAG_DESC])
    )
    .filter(Boolean);
}

export function adaptStudioMcpOptions(items = []) {
  return toArray(items)
    .map((item) =>
      adaptStudioSimpleOption(item, [S.LABEL, S.NAME, S.ID, S.MCP_NAME, S.MCP_ID, S.MCP_DESC])
    )
    .filter(Boolean);
}

export function adaptStudioMainInfo(response = {}, options = {}) {
  const data = unwrapApiBody(response, response) || {};
  return {
    categories: adaptStudioCategories(data?.[S.SYS_INFO_LIST], options),
    modelOptions: adaptStudioModelOptions(data?.[S.STUDIO_MODEL_LIST]),
    ragOptions: adaptStudioRagOptions(data?.[S.RAG_DATA_LIST]),
    mcpOptions: adaptStudioMcpOptions(data?.[S.MCP_PLUGIN_LIST]),
    raw: data,
  };
}

export function adaptStudioAuthorityItem(item = {}) {
  return {...item, checked: false};
}

export function adaptStudioAuthorityList(response = []) {
  return toArray(unwrapApiBody(response, response)).map(adaptStudioAuthorityItem);
}

export function adaptStudioItem(item = {}, index = 0, options = {}) {
  const name = readString(item, [S.STUDIO_NAME, S.CAMEL_STUDIO_NAME], `Studio ${index + 1}`);
  const model = parseFirstStudioModelName(readRaw(item, [S.CONN_MODEL_NAME], "")) || options.defaultModel || "GPT-OSS";
  const isMine = readBoolean(item, [S.STUDIO_OWNER_YN, S.STUDIO_MEMBER_YN]);
  const hasAuthScope = readBoolean(item, [S.AUTH_YN, S.STUDIO_PRIVATE_YN, S.PRIVATE_YN]);

  return {
    id: readString(item, [S.STUDIO_ID_LEGACY_TYPO, S.STUDIO_ID, S.CAMEL_STUDIO_ID], `studio-${index}`),
    initial: name.slice(0, 1).toUpperCase(),
    name,
    categoryCode: readString(item, [S.STUDIO_CATEGORY_CODE, S.CAMEL_STUDIO_CATEGORY_CODE], options.defaultCategoryCode || "COMMON"),
    category: readString(
      item,
      [S.STUDIO_CATEGORY_NAME_KO, S.STUDIO_CATEGORY_NAME_EN, S.STUDIO_CATEGORY_CODE, S.CAMEL_STUDIO_CATEGORY_CODE],
      options.defaultCategory || "Common"
    ),
    model,
    description: readString(item, [S.STUDIO_DESC], options.defaultDescription || ""),
    likes: readNumber(item, [S.STUDIO_LIKE_COUNT, S.CAMEL_STUDIO_LIKE_COUNT], 0),
    views: readNumber(item, [S.STUDIO_WATCH_COUNT], 0),
    owner: readString(item, [S.USER_NAME, S.USER_ID, S.REG_USER_ID], options.defaultUser || ""),
    isMine,
    knowledge: readRaw(item, [S.STUDIO_AUTH_ARRAY], options.defaultKnowledge || ""),
    scope: hasAuthScope
      ? options.authScope || options.publicScope || ""
      : options.publicScope || "",
    prompts: typeof options.createPromptExamples === "function" ? options.createPromptExamples() : [],
    raw: item,
  };
}

export function adaptStudioList(response = [], options = {}) {
  return toArray(unwrapApiBody(response, response)).map((item, index) =>
    adaptStudioItem(item, index, options)
  );
}
