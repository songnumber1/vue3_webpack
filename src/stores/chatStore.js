/**
 * @file stores/chatStore.js
 * @description Pinia 전역 상태 저장소입니다. 화면 간 공유되어야 하는 business/runtime 상태를 관리합니다.
 *
 * 프리징 코드 주석 기준:
 * - 이 주석은 코드 추적을 돕기 위한 설명이며 런타임 동작을 변경하지 않습니다.
 * - 함수/상태가 다른 composable, store, component로 전달되는 경우 호출 방향을 먼저 확인하세요.
 */

import {defineStore} from "pinia";
import {usePromptControlStore} from "@/stores/promptControlStore";
import {ACTIVE_ROOM_TYPES, normalizeActiveRoomType} from "@/constants/chatRoom";
export {ACTIVE_ROOM_TYPES};

/**
 * @description 활성 대화방 리스트, 메시지 버퍼, 그리고 입력창 툴바 옵션 세팅 맵을 통합 중계 보존하는 챗 비즈니스 코어 스토어입니다.
 */
export const useChatStore = defineStore("chat", {
  // 실시간 다이나믹 채팅 상태 데이터 세트 명세
  state: () => ({
    histories: [], // 좌측 히스토리 보드에 빌드 렌더링될 과거 대화방 마스터 리스트 배열
    selectedChatId: null, // 현재 화면 중앙 영역을 장악 중인 메인 룸 고유 Chat ID 식별자
    activeRoomId: null, // URL 숨김/공유 조회 정책에서 현재 화면에 표시할 방 ID
    activeRoomType: null, // activeRoomId의 출처 타입(chat/shared)
    pendingSelectedChatId: null, // 대화방 전환 클릭 직후 실제 session 세팅 전까지 좌측 메뉴 선택 색상을 먼저 반영하기 위한 임시 Chat ID
    activeSession: null, // 백엔드 세션 소켓 커넥션 정보 및 읽기 전용 가드 상태 믹스드 객체
    messageMap: {}, // 챗방 ID를 최상위 키로 삼아 대화 말풍선 어레이 목록을 캐시 보존하는 거대 레포지토리
    pendingNewSubmitChatIds: {}, // 메인 새 대화 submit 직후 라우트 전환 시 기존 대화방 historyRender overlay/scroll을 건너뛰기 위한 일회성 플래그 맵
  }),
  getters: {
    /**
     * 현재 선택 상태인 단일 대화방 레코드 정보 스냅샷을 히스토리 목록에서 정밀 서칭합니다.
     */
    activeHistory: (state) =>
      state.histories.find(
        (item) => String(item.id) === String(state.selectedChatId)
      ) || null,
    /**
     * 현재 열려있는 챗방 ID 소유의 실시간 대화 말풍선(메시지) 배열 팩을 추출하여 뷰포트에 공유 노출합니다.
     */
    activeMessages: (state) =>
      state.selectedChatId ? state.messageMap[state.selectedChatId] || [] : [],
    /**
     * URL 숨김 정책 또는 공유방 조회 정책에서 현재 화면에 표시 중인 방이 공유 링크 기반인지 판별합니다.
     */
    isActiveSharedRoom: (state) =>
      state.activeRoomType === ACTIVE_ROOM_TYPES.shared,
    /**
     * 특정 챗방이 히스토리 박제 형태 또는 이미 완료 처리되어 AI 모델 사양을 유저가 도중에 함부로 가로채 교체할 수 없도록 강제 락을 걸었는지 확인하는 판별식입니다.
     */
    isModelLocked: (state) => Boolean(state.activeSession?.readonlyModel),
  },
  actions: {
    /**
     * 메인 화면 새 대화 첫 질문으로 생성된 방 ID를 일회성 플래그로 기록합니다.
     * ChatContainer가 main -> chat 라우트 전환으로 재생성되어도 Pinia store에 남아 있어
     * 기존 대화방 입장용 historyRender overlay와 하단 강제 이동을 정확히 건너뛸 수 있습니다.
     */
    markPendingNewSubmitChat(chatId) {
      const id = String(chatId || "").trim();
      if (!id) return;
      this.pendingNewSubmitChatIds = {
        ...this.pendingNewSubmitChatIds,
        [id]: true,
      };
    },
    /**
     * 새 대화 submit 플래그를 한 번만 소비합니다.
     * true가 반환되는 경우에는 이미 submit 흐름에서 사용자 질문/assistant typing 메시지가
     * messageMap에 들어간 상태이므로 history historyRender을 수행하지 않습니다.
     */
    consumePendingNewSubmitChat(chatId) {
      const id = String(chatId || "").trim();
      if (!id || !this.pendingNewSubmitChatIds[id]) return false;
      const next = {...this.pendingNewSubmitChatIds};
      delete next[id];
      this.pendingNewSubmitChatIds = next;
      return true;
    },

    /**
     * 백엔드 세션 조회 API 등으로부터 전달받은 전체 대화 이력 히스토리를 강제 동기화 수립합니다.
     */
    setHistories(histories = []) {
      this.histories = histories;
    },
    /**
     * 고유 식별 Key를 기반으로 타깃 대화 이력 단일 레코드를 안전하게 뒤져내 반환합니다.
     */
    getHistory(id) {
      return (
        this.histories.find((item) => String(item.id) === String(id)) || null
      );
    },
    /**
     * 일반 채팅은 hidden-only /chat entry를 사용하므로 현재 화면에 표시할 방을 단일 activeRoom 상태로 기록합니다.
     * selectedChatId는 URL param 대신 Pinia 기준의 현재 일반 대화방 id로 유지합니다.
     */
    setActiveRoom(roomId, roomType = ACTIVE_ROOM_TYPES.chat) {
      const id = String(roomId || "").trim();
      const type = normalizeActiveRoomType(roomType);
      this.activeRoomId = id || null;
      this.activeRoomType = id && type ? type : null;
    },
    setActiveChatRoom(chatId) {
      this.setActiveRoom(chatId, ACTIVE_ROOM_TYPES.chat);
    },
    setActiveSharedRoom(shareId) {
      this.setActiveRoom(shareId, ACTIVE_ROOM_TYPES.shared);
    },
    clearActiveRoom() {
      this.activeRoomId = null;
      this.activeRoomType = null;
    },

    /**
     * @function setActiveSession
     * @description 유저가 대화방을 체인지하거나 새로운 방에 인입했을 때 글로벌 세션 상태와 포인터 ID를 리타겟팅 스위칭합니다.
     * @param {object|null} session - 새로 개통 전개된 챗방 세션 디테일 오브젝트
     */
    setActiveSession(session = null) {
      this.activeSession = session;
      this.selectedChatId = session?.chatId || null; // 활성 룸 포인터 인덱스 강제 변환 수립
      if (this.selectedChatId) {
        this.setActiveChatRoom(this.selectedChatId);
      } else if (this.activeRoomType !== ACTIVE_ROOM_TYPES.shared) {
        this.clearActiveRoom();
      }
      usePromptControlStore().setActivePromptToolSettingsKey(this.selectedChatId);
      this.clearPendingSelectedChatId(); // 실제 활성 방 포인터가 확정되었으므로 클릭 선반영 상태를 해제
      usePromptControlStore().resetActivePromptToolSettings(); // 방이 체인지되었으므로 툴바 세팅 캐시 구조체도 타깃에 맞게 세로정렬 리셋 트리거
    },
    /**
     * 현재 활성화된 방을 폭파 해제하고 공백 상태로 뷰포트를 전면 언마운트 리셋 클리어합니다.
     */
    clearActiveSession() {
      this.activeSession = null;
      this.selectedChatId = null;
      this.clearActiveRoom();
      usePromptControlStore().setActivePromptToolSettingsKey(null);
      this.clearPendingSelectedChatId();
      usePromptControlStore().resetActivePromptToolSettings();
    },

    /**
     * 대화방 클릭 직후 route/data historyRender이 완료되기 전까지 좌측 메뉴 선택 색상만 먼저 반영합니다.
     */
    setPendingSelectedChatId(chatId) {
      const id = String(chatId || "").trim();
      this.pendingSelectedChatId = id || null;
    },
    /**
     * 실제 selectedChatId가 확정되었거나 전환이 취소/실패된 경우 클릭 선반영 상태를 정리합니다.
     */
    clearPendingSelectedChatId() {
      this.pendingSelectedChatId = null;
    },
    /**
     * 특정 대화방 소유의 말풍선 메시지 리스트 데이터 타깃 풀을 업데이트 맵핑 주입합니다.
     */
    setMessages(chatId, messages = []) {
      this.messageMap = {
        ...this.messageMap,
        [chatId]: messages, // 해시 구조 갱신 리액티비티 트리거 유도
      };
    },
    /**
     * 긴 대화방을 여러 번 전환하면 이전 방의 message 배열이 캐시에 계속 남아
     * DOM은 제거되어도 JS heap이 회수되지 않습니다. 현재 열 방만 보존하고
     * 비활성 메시지 배열은 명시적으로 제거해 대용량 방 반복 진입 시 메모리 누적을 방지합니다.
     *
     * 입력창 툴바 설정도 대화방 ID별 map 구조라서 동일한 시점에 비활성 방의 설정을 함께 정리합니다.
     * 단, 아직 chatId가 없는 새 대화 화면에서 사용하는 draft 설정 슬롯은 항상 보존합니다.
     */
    pruneInactiveMessageCache(keepChatId) {
      const keepId = String(keepChatId || "");
      const nextMessageMap = {};

      Object.entries(this.messageMap || {}).forEach(([chatId, list]) => {
        if (String(chatId) === keepId) {
          nextMessageMap[chatId] = list;
        }
      });

      this.messageMap = nextMessageMap;
      usePromptControlStore().prunePromptToolSettingsCache(keepChatId);
    },
    /**
     * 새로운 대화 이력이 생성되었거나 변경 사항이 발생했을 때 리스트 최선두에 아이템을 새치기 배치하고 구방을 뒤로 밀어 정렬합니다.
     */
    addHistory(history) {
      this.histories = [
        history,
        ...this.histories.filter((item) => item.id !== history.id), // 중복 제거 매칭 스크리닝 동시 집행
      ];
    },


  },
});
