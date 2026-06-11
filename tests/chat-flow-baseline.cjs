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

function assertLastOrder(source, before, after, message) {
  const beforeIndex = source.indexOf(before);
  const afterIndex = source.lastIndexOf(after);
  assert(beforeIndex >= 0, `${message}: missing before token ${before}`);
  assert(afterIndex >= 0, `${message}: missing after token ${after}`);
  assert(beforeIndex < afterIndex, message);
}

const chatSearchWorkspace = read('src/components/search/ChatSearchWorkspace.vue');
const conversationUrlPolicy = read('src/composables/chat/navigation/conversationUrlPolicy.js');
const routePolicy = read('src/composables/chat/policy/chatRoutePolicy.js');
const systemSettings = read('src/constants/systemSettings.js');

assert(
  systemSettings.includes('process.env.VUE_APP_SYSTEM_CONVERSATION_URL_MODE') &&
    systemSettings.includes('CONVERSATION_URL_MODES.hidden'),
  'conversationUrlMode default must remain hidden for operation baseline'
);
const router = read('src/core/resolver/router.js');
const historyLoader = read('src/composables/chat/history/useHistoryConversationLoader.js');
const sidebarActions = read('src/composables/chat/sidebar/useChatSidebarActions.js');
const chatContainer = read('src/containers/chat/ChatContainer.vue');
const studioPortalActions = read('src/composables/chat/studio/useChatStudioPortalActions.js');
const chatRuntime = read('src/composables/chat/useChatRuntime.js');
const sessionPolicy = read('src/composables/chat/policy/chatSessionPolicy.js');
const chatHeaderPolicy = read('src/composables/chat/policy/chatHeaderPolicy.js');
const dataController = read('src/composables/chat/container/useChatDataController.js');
const runAll = read('tests/run-all.cjs');

assert(
  runAll.includes("require('./url-policy-static.cjs')") &&
    runAll.includes("require('./chat-flow-baseline.cjs')"),
  'regression runner must include URL policy and chat flow baseline checks'
);

assert(
  chatSearchWorkspace.includes('async function openChat(result)') &&
    chatSearchWorkspace.includes('ensureSearchResultHistory(result, chatId)') &&
    chatSearchWorkspace.includes('const hiddenMode = isHiddenConversationUrlMode(systemSettingsStore.settings)') &&
    chatSearchWorkspace.includes('chatStore.setPendingSelectedChatId(chatId)') &&
    chatSearchWorkspace.includes('navigateToConversation({') &&
    chatSearchWorkspace.includes('await router.replace({query}).catch(() => {})'),
  'chat search result selection must preserve hidden URL navigation, history seed, and target-message query flow'
);
assertOrder(
  chatSearchWorkspace,
  'chatStore.setPendingSelectedChatId(chatId)',
  'await navigateToConversation({',
  'hidden URL search navigation must set pendingSelectedChatId before routing to /chat'
);
assertOrder(
  chatSearchWorkspace,
  'await navigateToConversation({',
  'await router.replace({query}).catch(() => {})',
  'search target message query must be applied after conversation route navigation'
);
assert(
  chatSearchWorkspace.includes('chatStore.clearPendingSelectedChatId()'),
  'failed hidden search navigation must clear its pending selected chat id'
);

assert(
  routePolicy.includes('createConversationRoute') &&
    routePolicy.includes('createChatEntryRoute()') &&
    routePolicy.includes('createChatRoomRoute(id)') &&
    routePolicy.includes('resolveConversationUrlGuard') &&
    routePolicy.includes('resolveConversationRouteReconciliation') &&
    routePolicy.includes('applyHiddenConversationActiveRoom') &&
    routePolicy.includes('setActiveChatRoom'),
  'conversation URL route decisions must be centralized in chatRoutePolicy'
);
assertLastOrder(
  conversationUrlPolicy,
  'return await navigate.call(router, route)',
  'applyHiddenConversationActiveRoom({chatId, chatStore, settings})',
  'hidden URL activeRoom must be applied after navigation attempt to avoid route watcher races'
);

assert(
  router.includes('function guardConversationUrlMode') &&
    router.includes('resolveConversationUrlGuard({') &&
    routePolicy.includes('to?.name === ROUTE_NAMES.CHAT_ENTRY') &&
    routePolicy.includes('getActiveChatRoomId(chatStore)') &&
    routePolicy.includes('name: ROUTE_NAMES.MAIN') &&
    routePolicy.includes('!chatStreamStore?.isStreaming'),
  'bare /chat without an active/pending chat room must be guarded back to main through chatRoutePolicy'
);
assert(
  router.includes('function isAllowedHistoryLockNavigation') &&
    router.includes('to.name === ROUTE_NAMES.STUDIO') &&
    router.includes('to.name === ROUTE_NAMES.CONNECTOR_STORE') &&
    router.includes('isPendingHiddenChatRoute') &&
    router.includes('getPendingSelectedChatId(chatStore)'),
  'history lock guard must allow explicit Studio/MCP exits and internal hidden pending chat navigation'
);

assert(
  historyLoader.includes('hasPendingHiddenNavigation') &&
    historyLoader.includes('hasPendingHiddenChatNavigation({') &&
    historyLoader.includes('if (!hasPendingHiddenNavigation) {') &&
    historyLoader.includes('clearActiveSession();') &&
    historyLoader.includes('await router.replace({name: ROUTE_NAMES.MAIN}'),
  'history loader must distinguish hidden pending navigation from true /chat refresh/direct access through chatRoutePolicy'
);
assertOrder(
  historyLoader,
  'const hasPendingHiddenNavigation',
  'if (!hasPendingHiddenNavigation) {\n      clearActiveSession();',
  'hidden pending navigation guard must be calculated before clearing active session'
);

assert(
  sidebarActions.includes('function preparePortalNavigation()') &&
    sidebarActions.includes('function cleanupAfterPortalNavigation()') &&
    sidebarActions.includes('await router?.push(targetRoute).catch(() => {})') &&
    sidebarActions.includes('cleanupAfterPortalNavigation()'),
  'sidebar portal navigation must keep prepare/push/cleanup structure'
);
assertOrder(
  sidebarActions,
  'await router?.push(targetRoute).catch(() => {})',
  'cleanupAfterPortalNavigation();',
  'sidebar Studio/MCP portal cleanup must run after route push to prevent main flicker or hidden /chat fallback'
);
assert(
  chatContainer.includes('useChatStudioPortalActions({') &&
    chatContainer.includes('handleAssistantNewChat') &&
    studioPortalActions.includes('function preparePortalNavigation()') &&
    studioPortalActions.includes('function cleanupAfterPortalNavigation()') &&
    studioPortalActions.includes('await router?.push(targetRoute).catch(() => {})') &&
    studioPortalActions.includes('cleanupAfterPortalNavigation()'),
  'ChatContainer must delegate mobile/bottom-sheet Studio/MCP portal navigation to useChatStudioPortalActions'
);
assertOrder(
  studioPortalActions,
  'await router?.push(targetRoute).catch(() => {})',
  'cleanupAfterPortalNavigation();',
  'mobile/bottom-sheet Studio/MCP portal cleanup must run after route push'
);

assert(
  chatRuntime.includes('resolveConversationSessionState({') &&
    sessionPolicy.includes('export function resolveConversationSessionState') &&
    sessionPolicy.includes('markSessionAsMissingAssistant({') &&
    sessionPolicy.includes('modelUnavailableReason: "missing-assistant"') &&
    sessionPolicy.includes('nextSession.displayAssistantLabel = deletedStudio.displayLabel'),
  'session policy must preserve deleted Studio session as unavailable while keeping its original display label'
);
assert(
  dataController.includes('resolveWorkspaceAssistantLabel({') &&
    chatHeaderPolicy.includes('activeSession?.displayAssistantLabel') &&
    chatHeaderPolicy.includes('!activeSession?.isModelUnavailable'),
  'chat header policy must prefer activeSession display label and avoid current assistant fallback for unavailable sessions'
);
assertOrder(
  chatHeaderPolicy,
  'activeSession?.displayAssistantLabel',
  '!activeSession?.isModelUnavailable',
  'workspace assistant label must prefer saved session display label before current-assistant fallback checks'
);
assert(
  studioPortalActions.includes('markSessionAsMissingAssistant({') &&
    sessionPolicy.includes('displayAssistantLabel: session?.displayAssistantLabel || deletedAssistantLabel') &&
    sessionPolicy.includes('isModelUnavailable: true') &&
    sessionPolicy.includes('modelUnavailableReason: "missing-assistant"'),
  'deleting the current Studio must use chatSessionPolicy to leave the active chat session unavailable with preserved header label'
);

console.log('chat flow baseline checks passed');
