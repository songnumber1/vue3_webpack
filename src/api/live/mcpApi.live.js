/**
 * @file api/live/mcpApi.live.js
 * @description MCP/Connector Store 화면에서 사용하는 실제 백엔드 API 호출을 캡슐화합니다.
 */

import {httpClient} from "@/api/clients/httpClient";
import {API_ENDPOINTS} from "@/constants/apiEndpoints";
import {unwrapApiBody} from "@/utils/apiResponseReader";

async function getMainInfo() {
  const response = await httpClient.get(API_ENDPOINTS.MCP_SEARCH_MAIN_INFO);
  return unwrapApiBody(response, {});
}

async function searchList(params = {}) {
  const response = await httpClient.get(API_ENDPOINTS.MCP_SEARCH_LIST, {
    params,
  });
  return unwrapApiBody(response, []);
}

export const mcpApiLive = {
  getMainInfo,
  searchList,
};
