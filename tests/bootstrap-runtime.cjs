const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const bootstrap = read("src/composables/app/appRuntimeBootstrap.js");
const chatRuntime = read("src/composables/chat/useChatRuntime.js");
const chatSubmit = read("src/composables/chat/useChatSubmit.js");
const chatStreamRunner = read(
  "src/composables/chat/submit/chatSubmitStreamRunner.js"
);
const chatContainerController = read(
  "src/composables/chat/useChatContainerController.js"
);
const chatDataController = read(
  "src/composables/chat/container/useChatDataController.js"
);

const chatSearch = read("src/composables/search/useChatSearch.js");
assert(
  chatSearch.includes("resolveChatApis") &&
    chatSearch.includes("chatHistoryApi.searchChats") &&
    !chatSearch.includes("chatSearchApiLive"),
  "chat search should use runtime chat APIs so frontend mock mode returns temporary search data"
);

assert(
  bootstrap.includes("Promise.allSettled") || bootstrap.includes("settled"),
  "bootstrap should keep graceful degradation based on allSettled/settled result handling"
);
assert(
  (chatContainerController.includes("useChatDataController") ||
    chatDataController.includes("useChatSubmit")) &&
    chatRuntime.includes("appendUserAndAssistantMessages"),
  "chat container/runtime should still compose submit logic and message state"
);
assert(
  chatSubmit.includes("isGenerating") &&
    chatSubmit.includes("runAssistantStream") &&
    chatStreamRunner.includes("streamGeneration"),
  "chat submit/runtime should preserve guarded streaming flow"
);

console.log("bootstrap/runtime checks passed");
