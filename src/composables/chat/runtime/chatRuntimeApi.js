/**
 * @file composables/chat/runtime/chatRuntimeApi.js
 * @description 채팅 실행 중 필요한 원격 API helper를 모아둔 모듈입니다.
 * App 최초 bootstrap과 분리하여 채팅방 생성/수정/삭제/메시지 조회/예시 프롬프트 조회만 담당합니다.
 */

import {resolveChatApis} from "@/api/runtime/chatApis";
import {adaptChatHistoryList} from "@/adapters/chatResponseAdapter";
import {adaptMessageList} from "@/adapters/messageResponseAdapter";
import {adaptExamplePromptList} from "@/adapters/promptAdapter";

/**
 * [원격 API 브릿지 - C] 신규 대화방 세션을 원격 저장소 서버에 수립 및 개통 신청합니다.
 */
export async function createChatHistory(payload = {}) {
  const {chatHistoryApi} = resolveChatApis();
  return chatHistoryApi.createChat(payload);
}

/**
 * [원격 API 브릿지 - R] 유저의 과거 전체 대화방 서랍 목록 리스트 데이터를 수집한 뒤 정형화 정렬 가공하여 반환합니다.
 */
export async function loadChatHistoryList(context = {}) {
  const {chatHistoryApi} = resolveChatApis();
  const rawHistories = await chatHistoryApi.getChatHistoryList();
  return adaptChatHistoryList(rawHistories, context);
}

/**
 * [원격 API 브릿지 - U] 특정 대화 기록의 상단 즐겨찾기 북마크 고정 고리 상태 여부를 동적 업데이트 처리합니다.
 */
export async function updateChatBookmark(payload = {}) {
  const {chatHistoryApi} = resolveChatApis();
  return chatHistoryApi.updateBookmark(payload);
}

/**
 * [원격 API 브릿지 - U] 사용자가 덮어씌운 텍스트를 기점으로 대화방 타이틀 명칭을 원격 수정 갱신합니다.
 */
export async function renameChatHistory(payload = {}) {
  const {chatHistoryApi} = resolveChatApis();
  return chatHistoryApi.renameChat(payload);
}

/**
 * [원격 API 브릿지 - D] 불필요해진 특정 대화방 레코드 아키텍처 리소스를 서버 데이터베이스에서 영구 소멸 소거합니다.
 */
export async function deleteChatHistory(payload = {}) {
  const {chatHistoryApi} = resolveChatApis();
  return chatHistoryApi.deleteChat(payload);
}

/**
 * [원격 API 브릿지 - R 세부 대화 정보] 특정 방 내부로 입장했을 때 과거에 유저와 AI가 주고받았던 시간순 대화 말풍선 히스토리 리스트를 완벽하게 정형화 추출합니다.
 */
export async function loadChatMessageRouters(payload = {}, options = {}) {
  const {chatHistoryApi} = resolveChatApis();
  const rawMessages = await chatHistoryApi.getChatHistoryDetail(
    payload,
    options
  );
  return adaptMessageList(rawMessages);
}

/**
 * [원격 API 브릿지 - 서브 추천 컴포넌트] 특정 어시스턴트방 하단에 배치할 단발성 추천 예시 힌트 질문 칩 배열 데이터 목록을 패치합니다.
 */
export async function loadExamplePrompts(assistantId, studioYN = false) {
  const {examplePromptApi} = resolveChatApis();
  const response = await examplePromptApi.getExamplePrompts({
    assistId: assistantId,
    studioYN,
  });
  return adaptExamplePromptList(response);
}
