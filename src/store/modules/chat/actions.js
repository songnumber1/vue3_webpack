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
};
