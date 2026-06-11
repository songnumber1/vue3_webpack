const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function assertOrder(source, before, after, message) {
  const beforeIndex = source.indexOf(before);
  const afterIndex = source.indexOf(after);
  assert(beforeIndex >= 0, `${message}: missing before token ${before}`);
  assert(afterIndex >= 0, `${message}: missing after token ${after}`);
  assert(beforeIndex < afterIndex, message);
}

const chatContainer = read('src/containers/chat/ChatContainer.vue');
const studioPortalActions = read('src/composables/chat/studio/useChatStudioPortalActions.js');

assert(
  chatContainer.includes('useChatStudioPortalActions({') &&
    chatContainer.includes('visibleAssistants') &&
    chatContainer.includes('handleStudioDetailDelete') &&
    chatContainer.includes('handleAssistantNewChat'),
  'ChatContainer must delegate Studio/MCP portal state and actions to useChatStudioPortalActions'
);

assert(
  !chatContainer.includes('function handleStudioDetailDelete') &&
    !chatContainer.includes('function syncAssistantSelectionWithRoute') &&
    !chatContainer.includes('function preparePortalNavigation'),
  'ChatContainer must not keep Studio delete, route sync, or portal reset implementation after step 6'
);

assert(
  studioPortalActions.includes('export function useChatStudioPortalActions') &&
    studioPortalActions.includes('function syncAssistantSelectionWithRoute') &&
    studioPortalActions.includes('async function handleStudioDetailDelete') &&
    studioPortalActions.includes('async function handleAssistantNewChat'),
  'useChatStudioPortalActions must own Studio route sync, detail delete, and Assistant new chat portal actions'
);

assert(
  studioPortalActions.includes('markSessionAsMissingAssistant') &&
    studioPortalActions.includes('preparePortalConversationNavigation') &&
    studioPortalActions.includes('cleanupAfterPortalConversationNavigation') &&
    studioPortalActions.includes('deleteStudio(deletedStudioId)'),
  'Studio portal actions must preserve deleted Studio session handling and portal navigation reset policy'
);

assertOrder(
  studioPortalActions,
  'await router?.push(targetRoute).catch(() => {})',
  'cleanupAfterPortalNavigation();',
  'Studio/MCP portal cleanup must run after route push to avoid hidden /chat fallback or main flicker'
);

console.log('chat studio portal action static checks passed');
