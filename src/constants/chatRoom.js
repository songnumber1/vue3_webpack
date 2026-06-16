/**
 * @file constants/chatRoom.js
 * @description Chat/Shared 활성 방 타입 기준값을 한 곳에서 관리합니다.
 */

export const ACTIVE_ROOM_TYPES = Object.freeze({
  chat: "chat",
  shared: "shared",
});

export function normalizeActiveRoomType(type) {
  return Object.values(ACTIVE_ROOM_TYPES).includes(type) ? type : null;
}
