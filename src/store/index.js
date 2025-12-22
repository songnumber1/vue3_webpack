import { createStore } from "vuex";

import chat from "./modules/chat";
import model from "./modules/model";
import prompt from "./modules/prompt";
import ui from "./modules/ui";
import input from "./modules/input";

export default createStore({
  modules: {
    chat,
    model,
    prompt,
    ui,
    input,
  },
});
