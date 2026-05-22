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
