/**
 * @file adapters/chatAdapter.js
 * @description 기존 import 호환을 유지하는 Chat/Message adapter facade입니다.
 */

export {
  adaptChatHistoryItem as adaptChatHistory,
  adaptChatHistoryList,
  adaptChatSearchItem,
  adaptChatSearchList,
  adaptChatSearchResponse,
  createHistoryFromSearchResult,
} from "@/adapters/chatResponseAdapter";

export {
  adaptMessageItem as adaptMessage,
  adaptMessageList,
} from "@/adapters/messageResponseAdapter";
