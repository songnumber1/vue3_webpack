import { createStore } from "vuex";

import ui from "./modules/ui";
import model from "./modules/model";
import prompt from "./modules/prompt";
import chat from "./modules/chat";
import input from "./modules/input";

export default createStore({
  modules: {
    input,
    ui,
    model,
    prompt,
    chat,
  },
});
