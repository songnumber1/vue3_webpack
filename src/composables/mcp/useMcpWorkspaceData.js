/**
 * @file composables/mcp/useMcpWorkspaceData.js
 * @description MCP workspace의 API 조회와 응답 정규화를 화면 컴포넌트 밖으로 분리합니다.
 */

import {mcpApiLive} from "@/api/live/mcpApi.live";
import {adaptMcpList, adaptMcpMainInfo} from "@/adapters/mcpResponseAdapter";

export function useMcpWorkspaceData(options = {}) {
  async function fetchMainInfo() {
    const response = await mcpApiLive.getMainInfo();
    return adaptMcpMainInfo(response, {
      allLabel: options.allLabel,
      allDescription: options.allDescription,
    });
  }

  async function fetchMcpList(params = {}) {
    const response = await mcpApiLive.searchList(params);
    return adaptMcpList(response, {
      defaultCategory: options.defaultCategory,
      defaultConnector: options.defaultConnector,
      defaultDescription: options.defaultDescription,
      defaultUser: options.defaultUser,
      defaultCapability: options.defaultCapability,
      publicScope: options.publicScope,
      createPromptExamples: options.createPromptExamples,
    });
  }

  return {
    fetchMainInfo,
    fetchMcpList,
  };
}
