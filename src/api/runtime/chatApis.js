import { accessApiMock } from '@/api/mock/accessApi.mock'
import { assistantApiMock } from '@/api/mock/assistantApi.mock'
import { modelApiMock } from '@/api/mock/modelApi.mock'
import { examplePromptApiMock } from '@/api/mock/examplePromptApi.mock'
import { chatHistoryApiMock } from '@/api/mock/chatHistoryApi.mock'

const USE_MOCK_API = true

export function resolveChatApis() {
  if (!USE_MOCK_API) {
    return {
      accessApi: accessApiMock,
      assistantApi: assistantApiMock,
      modelApi: modelApiMock,
      examplePromptApi: examplePromptApiMock,
      chatHistoryApi: chatHistoryApiMock,
    }
  }

  return {
    accessApi: accessApiMock,
    assistantApi: assistantApiMock,
    modelApi: modelApiMock,
    examplePromptApi: examplePromptApiMock,
    chatHistoryApi: chatHistoryApiMock,
  }
}
