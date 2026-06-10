/**
 * @file api/live/chatSearchApi.live.js
 * @description 채팅 검색 화면에서 사용하는 API 호출을 캡슐화합니다.
 */

import {chatHistoryApiLive} from "@/api/live/chatHistoryApi.live";

async function searchChats(payload = {}) {
  return chatHistoryApiLive.searchChats(payload);
}

export const chatSearchApiLive = {
  searchChats,
};
