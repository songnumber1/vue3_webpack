import {defineStore} from "pinia";

export const useChatStreamStore = defineStore("chatStream", {
  state: () => ({
    isStreaming: false,
  }),
  actions: {
    start() {
      this.isStreaming = true;
    },
    finish() {
      this.isStreaming = false;
    },
  },
});
