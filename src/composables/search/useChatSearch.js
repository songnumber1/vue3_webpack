/**
 * @file composables/search/useChatSearch.js
 * @description 채팅 검색 API 호출과 응답 정규화를 화면 컴포넌트 밖으로 분리합니다.
 */

import {chatSearchApiLive} from "@/api/live/chatSearchApi.live";
import {adaptChatSearchResponse} from "@/adapters/chatResponseAdapter";

export function useChatSearch(options = {}) {
  async function search(keyword = "") {
    const nextKeyword = String(keyword || "").trim();
    const response = await chatSearchApiLive.searchChats({
      keyword: nextKeyword,
      searchText: nextKeyword,
      query: nextKeyword,
      limit: options.limit || 200,
    });
    return adaptChatSearchResponse(response, {
      fallbackTitle: options.fallbackTitle,
      keyword: nextKeyword,
    });
  }

  return {search};
}
