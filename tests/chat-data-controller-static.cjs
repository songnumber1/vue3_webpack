const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const dataController = read('src/composables/chat/internal/container/useChatDataController.js');
const promptSuggestions = read('src/composables/chat/internal/container/useChatPromptSuggestions.js');
const historyState = read('src/composables/chat/internal/container/useChatHistoryState.js');
const mermaidGuards = read('src/composables/chat/internal/container/useChatMermaidHistoryGuards.js');

assert(
  dataController.includes('useChatPromptSuggestions({') &&
    promptSuggestions.includes('PROMPT_SUGGESTION_LIMIT') &&
    promptSuggestions.includes('currentExamplePrompts') &&
    promptSuggestions.includes('locale'),
  'prompt suggestion mapping must be extracted from useChatDataController'
);

assert(
  dataController.includes('useChatHistoryState({') &&
    historyState.includes('export function useChatHistoryState') &&
    historyState.includes('activeHistory') &&
    historyState.includes('clearPendingSelectedIfMatched') &&
    historyState.includes('clearPendingSelectedOnFailure'),
  'active history lookup and pending selected cleanup must be extracted from useChatDataController'
);

assert(
  dataController.includes('useChatMermaidHistoryGuards({') &&
    mermaidGuards.includes('isMermaidRenderingEnabledForPlatform') &&
    mermaidGuards.includes('hasMermaidInHistoryMessages') &&
    mermaidGuards.includes('/```\\s*mermaid/i'),
  'Mermaid history render guard must be extracted from useChatDataController'
);

assert(
  !dataController.includes('PROMPT_SUGGESTION_LIMIT') &&
    !dataController.includes('isMermaidRenderingEnabledForPlatform'),
  'useChatDataController should not directly depend on prompt limit or mermaid platform policy after step 7'
);


assert(
  !dataController.includes(`clearLazyHistoryMessages,
    clearLazyHistoryMessages,`) &&
    !dataController.includes(`clearLazyHistoryMessages,
      clearLazyHistoryMessages,`),
  'useChatDataController should not pass duplicate clearLazyHistoryMessages object keys'
);


console.log('chat data controller static checks passed');
