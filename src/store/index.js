import { createStore } from "vuex";

import chat from "./modules/chat";
import model from "./modules/model";
import prompt from "./modules/prompt";

export default createStore({
  modules: {
    chat,
    model,
    prompt,
  },
});
