/**
 * @file api/runtime/chatApis.js
 * @description 현재 runtime 설정에 따라 live/mock API 구현체를 선택해 노출합니다.
 *
 * 프리징 코드 주석 기준:
 * - 이 주석은 코드 추적을 돕기 위한 설명이며 런타임 동작을 변경하지 않습니다.
 * - 함수/상태가 다른 composable, store, component로 전달되는 경우 호출 방향을 먼저 확인하세요.
 */

import {accessApiMock} from "@/api/mock/accessApi.mock";
import {assistantApiMock} from "@/api/mock/assistantApi.mock";
import {modelApiMock} from "@/api/mock/modelApi.mock";
import {examplePromptApiMock} from "@/api/mock/examplePromptApi.mock";
import {promptTemplateApiMock} from "@/api/mock/promptTemplateApi.mock";
import {chatHistoryApiMock} from "@/api/mock/chatHistoryApi.mock";
import {accessApiLive} from "@/api/live/accessApi.live";
import {assistantApiLive} from "@/api/live/assistantApi.live";
import {modelApiLive} from "@/api/live/modelApi.live";
import {examplePromptApiLive} from "@/api/live/examplePromptApi.live";
import {promptTemplateApiLive} from "@/api/live/promptTemplateApi.live";
import {chatHistoryApiLive} from "@/api/live/chatHistoryApi.live";
import {shouldUseFrontendMockApi} from "@/constants/apiMode";

export function shouldUseMockChatApi() {
  return shouldUseFrontendMockApi();
}
export function resolveChatApis() {
  if (shouldUseMockChatApi()) {
    return {
      accessApi: accessApiMock,
      assistantApi: assistantApiMock,
      modelApi: modelApiMock,
      examplePromptApi: examplePromptApiMock,
      promptTemplateApi: promptTemplateApiMock,
      chatHistoryApi: chatHistoryApiMock,
    };
  }

  return {
    accessApi: accessApiLive,
    assistantApi: assistantApiLive,
    modelApi: modelApiLive,
    examplePromptApi: examplePromptApiLive,
    promptTemplateApi: promptTemplateApiLive,
    chatHistoryApi: chatHistoryApiLive,
  };
}
