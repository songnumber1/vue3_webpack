import {accessApiMock} from "@/api/mock/accessApi.mock";
import {assistantApiMock} from "@/api/mock/assistantApi.mock";
import {modelApiMock} from "@/api/mock/modelApi.mock";
import {examplePromptApiMock} from "@/api/mock/examplePromptApi.mock";
import {chatHistoryApiMock} from "@/api/mock/chatHistoryApi.mock";
import {accessApiLive} from "@/api/live/accessApi.live";
import {assistantApiLive} from "@/api/live/assistantApi.live";
import {modelApiLive} from "@/api/live/modelApi.live";
import {examplePromptApiLive} from "@/api/live/examplePromptApi.live";
import {chatHistoryApiLive} from "@/api/live/chatHistoryApi.live";

/**
 * Chat runtime API가 mock을 사용할지 판단합니다.
 *
 * method: env flag read
 * payload: VUE_APP_USE_MOCK_API
 * response: true이면 src/api/mock, false이면 src/api/live 사용
 * 특징: 기본값은 mock입니다. 운영 연결 시 .env에 VUE_APP_USE_MOCK_API=false를 지정하면 live API로 전환됩니다.
 *
 * @returns {boolean} mock API 사용 여부입니다.
 */
export function shouldUseMockChatApi() {
  return process.env.VUE_APP_USE_MOCK_API !== "false";
}

/**
 * Chat runtime에 필요한 API facade를 반환합니다.
 *
 * method: resolve
 * payload: VUE_APP_USE_MOCK_API
 * response: { accessApi, assistantApi, modelApi, examplePromptApi, chatHistoryApi }
 * 특징: UI/Business 계층은 mock/live 여부를 몰라도 동일한 method 이름으로 API를 호출합니다.
 *
 * @returns {{accessApi: object, assistantApi: object, modelApi: object, examplePromptApi: object, chatHistoryApi: object}} API facade입니다.
 */
export function resolveChatApis() {
  if (shouldUseMockChatApi()) {
    return {
      accessApi: accessApiMock,
      assistantApi: assistantApiMock,
      modelApi: modelApiMock,
      examplePromptApi: examplePromptApiMock,
      chatHistoryApi: chatHistoryApiMock,
    };
  }

  return {
    accessApi: accessApiLive,
    assistantApi: assistantApiLive,
    modelApi: modelApiLive,
    examplePromptApi: examplePromptApiLive,
    chatHistoryApi: chatHistoryApiLive,
  };
}
