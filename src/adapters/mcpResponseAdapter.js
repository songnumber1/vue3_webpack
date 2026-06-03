/**
 * @file adapters/mcpResponseAdapter.js
 * @description MCP/Connector API 원본 응답 key 접근을 한 곳으로 모아 화면용 모델로 정규화합니다.
 */

import {readBoolean, readNumber, readRaw, readString} from "@/adapters/adapterPrimitives";
import {MCP_API_KEYS as M} from "@/constants/api/mcpApiKeys";
import {unwrapApiBody} from "@/utils/apiResponseReader";

function toArray(value) {
  return Array.isArray(value) ? value : [];
}

export function adaptMcpCategory(item = {}, options = {}) {
  const value = readString(item, [M.MCP_CATEGORY_CODE], options.allValue || "ALL");
  return {
    value,
    label: readString(
      item,
      [M.MCP_CATEGORY_NAME_KO, M.MCP_CATEGORY_NAME_EN, M.MCP_CATEGORY_CODE],
      options.allLabel || "All"
    ),
    description: readString(
      item,
      [M.MCP_CATEGORY_DESC_KO, M.MCP_CATEGORY_DESC_EN],
      options.allDescription || ""
    ),
  };
}

export function adaptMcpCategories(items = [], options = {}) {
  const categories = toArray(items)
    .filter((item) => readRaw(item, [M.MCP_CATEGORY_USE_YN], true) !== false)
    .map((item) => adaptMcpCategory(item, options))
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

export function adaptMcpMainInfo(response = {}, options = {}) {
  const data = unwrapApiBody(response, response) || {};
  return {
    categories: adaptMcpCategories(data?.[M.SYS_INFO_LIST], options),
    raw: data,
  };
}

export function adaptMcpItem(item = {}, index = 0, options = {}) {
  const name = readString(item, [M.MCP_NAME, M.CONNECTOR_NAME], `MCP ${index + 1}`);
  const isCreated = readBoolean(item, [M.REG_YN, M.CREATED_YN]);
  const isSubscribed = readBoolean(item, [M.SUBSCRIBE_YN, M.SUBSCRIBED_YN]);

  return {
    id: readString(item, [M.MCP_ID, M.CONNECTOR_ID], `mcp-${index}`),
    initial: name.slice(0, 1).toUpperCase(),
    name,
    categoryCode: readString(item, [M.MCP_CATEGORY_CODE], options.defaultCategoryCode || "COMM"),
    category: readString(
      item,
      [M.MCP_CATEGORY_NAME_KO, M.MCP_CATEGORY_NAME_EN, M.MCP_CATEGORY_CODE],
      options.defaultCategory || "Common"
    ),
    model: readString(item, [M.CONNECTOR_TYPE, M.MCP_TYPE], options.defaultConnector || "Connector"),
    description: readString(item, [M.MCP_DESC, M.CONNECTOR_DESC], options.defaultDescription || ""),
    likes: readNumber(item, [M.MCP_LIKE_COUNT], 0),
    views: readNumber(item, [M.MCP_SUBSCRIBE_COUNT, M.MCP_WATCH_COUNT], 0),
    owner: readString(item, [M.USER_NAME, M.USER_ID], options.defaultUser || ""),
    isMine: isCreated || isSubscribed,
    isCreated,
    isSubscribed,
    knowledge: readRaw(item, [M.MCP_CAPABILITY, M.MCP_AUTH_ARRAY], options.defaultCapability || ""),
    scope: readString(item, [M.MCP_SCOPE], options.publicScope || ""),
    prompts: typeof options.createPromptExamples === "function" ? options.createPromptExamples() : [],
    raw: item,
  };
}

export function adaptMcpList(response = [], options = {}) {
  return toArray(unwrapApiBody(response, response)).map((item, index) =>
    adaptMcpItem(item, index, options)
  );
}
