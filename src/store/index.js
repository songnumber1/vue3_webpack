import {createStore} from "vuex";
import persistedPlugin from "@/plugins/vuex-idb";

export default createStore({
  state: () => ({
    chatroomId: null,
    messages: [],
  }),
  mutations: {
    setChatroomId(state, id) {
      state.chatroomId = id;
    },
    setMessages(state, msgs) {
      state.messages = msgs;
    },
    addMessage(state, msg) {
      state.messages.push(msg);
    },
  },
  plugins: [persistedPlugin(["chatroomId", "messages"], "chatApp")],
});
