/**
 * @file composables/studio/useStudioWorkspaceData.js
 * @description Studio workspace의 API 조회와 응답 정규화를 화면 컴포넌트 밖으로 분리합니다.
 */

import {studioApiLive} from "@/api/live/studioApi.live";
import {
  adaptStudioAuthorityList,
  adaptStudioList,
  adaptStudioMainInfo,
} from "@/adapters/studioResponseAdapter";

export function useStudioWorkspaceData(options = {}) {
  async function fetchMainInfo() {
    const response = await studioApiLive.getMainInfo();
    return adaptStudioMainInfo(response, {
      allLabel: options.allLabel,
      allDescription: options.allDescription,
    });
  }

  async function fetchAuthorityInfo() {
    const response = await studioApiLive.getAuthorityInfo();
    return adaptStudioAuthorityList(response);
  }

  async function fetchStudioList(params = {}) {
    const response = await studioApiLive.searchList(params);
    return adaptStudioList(response, {
      defaultCategory: options.defaultCategory,
      defaultDescription: options.defaultDescription,
      defaultUser: options.defaultUser,
      defaultKnowledge: options.defaultKnowledge,
      publicScope: options.publicScope,
      authScope: options.authScope,
      createPromptExamples: options.createPromptExamples,
    });
  }

  return {
    fetchMainInfo,
    fetchAuthorityInfo,
    fetchStudioList,
  };
}
