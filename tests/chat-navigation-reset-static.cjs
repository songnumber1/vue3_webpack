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

const resetPolicy = read('src/composables/chat/internal/navigation/chatNavigationReset.js');
const sidebarActions = read('src/composables/chat/sidebar/useChatSidebarActions.js');
const navigationActions = read('src/composables/chat/internal/container/useChatNavigationActions.js');
const chatContainer = read('src/containers/chat/ChatContainer.vue');
const studioPortalActions = read('src/composables/chat/studio/useChatStudioPortalActions.js');

assert(
  resetPolicy.includes('export function clearConversationNavigationState') &&
    resetPolicy.includes('export function preparePortalConversationNavigation') &&
    resetPolicy.includes('export function cleanupAfterPortalConversationNavigation') &&
    resetPolicy.includes('export async function navigateToMainAfterConversationReset'),
  'chat navigation reset helpers must be centralized in chatNavigationReset.js'
);
assert(
  resetPolicy.includes('chatStore?.clearPendingSelectedChatId') &&
    resetPolicy.includes('releaseChatHistoryLock') &&
    resetPolicy.includes('chatStore?.clearActiveSession') &&
    resetPolicy.includes('navigationStore?.closeTransientPanels'),
  'chat navigation reset helpers must cover pending chat id, history lock, active session, and transient panels'
);

assert(
  sidebarActions.includes('preparePortalConversationNavigation') &&
    sidebarActions.includes('cleanupAfterPortalConversationNavigation') &&
    sidebarActions.includes('navigateToMainAfterConversationReset') &&
    sidebarActions.includes('resetConversationStateForRouteChangeByPolicy'),
  'sidebar actions must delegate conversation reset order to chatNavigationReset helpers'
);
assertOrder(
  sidebarActions,
  'await router?.push(targetRoute).catch(() => {})',
  'cleanupAfterPortalNavigation();',
  'sidebar portal cleanup must still run after Studio/MCP route push'
);

assert(
  navigationActions.includes('clearConversationNavigationStateByPolicy') &&
    navigationActions.includes('navigateToMainAfterConversationReset'),
  'container navigation actions must delegate main reset route correction to chatNavigationReset helpers'
);

assert(
  chatContainer.includes('useChatStudioPortalActions({') &&
    studioPortalActions.includes('preparePortalConversationNavigation') &&
    studioPortalActions.includes('cleanupAfterPortalConversationNavigation'),
  'ChatContainer portal navigation must delegate prepare/cleanup reset through useChatStudioPortalActions'
);
assertOrder(
  studioPortalActions,
  'await router?.push(targetRoute).catch(() => {})',
  'cleanupAfterPortalNavigation();',
  'Studio/MCP portal cleanup must still run after route push'
);

console.log('chat navigation reset static checks passed');
