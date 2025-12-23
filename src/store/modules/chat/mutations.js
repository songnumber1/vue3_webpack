import { normalizeStore } from "@/storage/chatStore";

export default {
  SET_STORE(state, next) {
    state.store = normalizeStore(next);
  },
};
