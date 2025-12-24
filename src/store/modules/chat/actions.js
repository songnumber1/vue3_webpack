import { normalizeStore, saveStore } from "@/storage/chatStore";

export default {
  update({ commit }, next) {
    const normalized = normalizeStore(next);
    commit("SET_STORE", normalized);
    saveStore(normalized);
  },

  // 현재 선택된 모델(group/model)을 chat store에도 동기화
  syncActiveModel({ getters, dispatch }, { groupId, modelId }) {
    const s = { ...(getters.safeStore || {}) };
    if (groupId) s.activeModelGroupId = groupId;
    if (modelId) s.activeModelId = modelId;

    const chat = (s.chats || []).find((c) => c.id === s.activeChatId);
    if (chat) {
      if (groupId) chat.modelGroupId = groupId;
      if (modelId) chat.modelId = modelId;
    }

    dispatch("update", s);
  },

  resetForNewAssistant({ getters, commit }, groupId) {
    const prev = getters.safeStore || {};

    const next = normalizeStore({
      chats: prev.chats || [], // ✅ 채팅 목록은 유지
      activeChatId: null, // ❗ 핵심
      draft: true, // ❗ 핵심
      activeModelGroupId: groupId,
      activeModelId: null, // normalizeStore가 기본값 보정
    });

    commit("SET_STORE", next);
    saveStore(next);
  },

  selectChat({ getters, dispatch }, chatId) {
    const s = { ...(getters.safeStore || {}) };
    s.activeChatId = chatId;
    s.draft = false;

    const chat = (s.chats || []).find((c) => c.id === chatId);
    if (chat) {
      if (chat.modelGroupId) s.activeModelGroupId = chat.modelGroupId;
      if (chat.modelId) s.activeModelId = chat.modelId;
    }

    dispatch("update", s);
  },
  
  deleteChat({ state, commit }, chatId) {
    const s = state.store;

    // 1️⃣ 해당 채팅 제거
    const nextChats = (s.chats || []).filter((c) => c.id !== chatId);

    // 2️⃣ activeChatId가 삭제 대상이면 draft 상태로 전환
    let nextActiveChatId = s.activeChatId;
    let nextDraft = s.draft;

    if (s.activeChatId === chatId) {
      nextActiveChatId = null;
      nextDraft = true;
    }

    const next = {
      ...s,
      chats: nextChats,
      activeChatId: nextActiveChatId,
      draft: nextDraft,
    };

    // 3️⃣ store 반영 + localStorage 저장
    commit("SET_STORE", next);
    saveStore(next);
  },
};
