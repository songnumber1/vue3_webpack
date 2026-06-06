const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const systemSettings = read('src/constants/systemSettings.js');
const systemSettingsView = read('src/views/settings/SystemSettingsView.vue');
const chatStore = read('src/stores/chatStore.js');
const urlPolicy = read('src/composables/chat/navigation/conversationUrlPolicy.js');
const router = read('src/core/resolver/router.js');
const sharedPage = read('src/views/SharedPage.vue');
const sharedChat = read('src/composables/chat/useSharedChat.js');
const dataController = read('src/composables/chat/container/useChatDataController.js');
const submit = read('src/composables/chat/useChatSubmit.js');
const chatContainer = read('src/containers/chat/ChatContainer.vue');
const workspace = read('src/components/workspace/ChatConversationWorkspace.vue');
const messageList = read('src/components/chat/MessageList.vue');
const renderPolicy = read('src/composables/chat/message-list/useMessageRenderPolicy.js');
const chatResponseAdapter = read('src/adapters/chatResponseAdapter.js');
const progressPolicy = read('src/composables/progress/progressPolicy.js');
const progressOverlay = read('src/components/overlay/ProgressOverlay.vue');
const apiRequestStore = read('src/stores/apiRequestStore.js');
const httpClient = read('src/api/clients/httpClient.js');
const streamRequest = read('src/api/sse/common/streamRequest.js');

assert(
  systemSettings.includes('CONVERSATION_URL_MODES') &&
    systemSettings.includes('conversationUrlMode') &&
    systemSettings.includes('visible') &&
    systemSettings.includes('hidden'),
  'conversationUrlMode visible/hidden system setting must exist'
);

assert(
  systemSettingsView.includes('hasConversationUrlModeChanged') &&
    systemSettingsView.includes('hasLogoutRequiredSettingChanged') &&
    systemSettingsView.includes('forceLogoutForPolicyChange'),
  'conversationUrlMode changes must require logout policy handling'
);

assert(
  chatStore.includes('activeRoomId') &&
    chatStore.includes('activeRoomType') &&
    chatStore.includes('setActiveChatRoom') &&
    chatStore.includes('setActiveSharedRoom') &&
    chatStore.includes('clearActiveRoom') &&
    chatStore.includes('isActiveSharedRoom'),
  'chatStore must expose single activeRoom state and shared-room guard'
);

assert(
  urlPolicy.includes('isHiddenConversationUrlMode') &&
    urlPolicy.includes('resolveActiveChatId') &&
    urlPolicy.includes('createConversationRoute') &&
    urlPolicy.includes('navigateToConversation') &&
    urlPolicy.includes('applyHiddenConversationActiveRoom') &&
    urlPolicy.includes('setActiveChatRoom'),
  'conversation URL visible/hidden policy helpers must be centralized'
);

assert(
  urlPolicy.indexOf('await navigate.call(router, route)') <
    urlPolicy.lastIndexOf('applyHiddenConversationActiveRoom({chatId, chatStore, settings})'),
  'hidden URL mode must apply activeRoom after navigation attempt to avoid first-chat empty render race'
);

assert(
  router.includes('path: "shared"') &&
    router.includes('name: "shared"') &&
    router.includes('path: "shared/:id"') &&
    router.includes('name: "shared-entry"'),
  'shared and shared-entry routes must exist'
);


assert(
  router.includes('to.name === "chat-entry"') &&
    router.includes('!isHiddenConversationUrlMode(systemSettingsStore.settings)'),
  'visible URL mode must redirect bare /chat(chat-entry) to main instead of showing an empty chat room'
);

assert(
  dataController.includes('hasPendingHiddenNavigation') &&
    dataController.includes('router.replace({name: "main"}') &&
    dataController.includes('URL 노출 모드에서는 /chat 단독 접근'),
  'data controller must guard bare /chat without active id and redirect hidden refresh/direct access to main'
);



assert(
  chatStore.includes('historyNavigationLocked') &&
    chatStore.includes('setHistoryNavigationLocked') &&
    chatStore.includes('isNavigationLocked'),
  'chatStore must keep a ProgressBar-independent navigation lock while history data/rendering is in progress'
);

assert(
  dataController.includes('chatStore.setHistoryNavigationLocked(true)') &&
    dataController.includes('chatStore.setHistoryNavigationLocked(false)') &&
    dataController.includes('hasPendingHiddenNavigation') &&
    dataController.includes('activeRoomId가 없는 /chat 새로고침/직접 접근'),
  'history render must lock navigation independently of ProgressBar and hidden /chat without activeRoom must redirect to main except pending internal navigation'
);

assert(
  router.includes('isAllowedHistoryLockNavigation') &&
    router.includes('chatStore.isNavigationLocked') &&
    router.includes('historyNavigationLocked') &&
    router.includes('pendingSelectedChatId') &&
    router.includes('isPendingVisibleChatRoute') &&
    router.includes('isPendingHiddenChatRoute') &&
    router.includes('from?.name === "shared-entry"') &&
    router.includes('chatStore.isActiveSharedRoom'),
  'router guard must block user navigation during history rendering even after pendingSelectedChatId is cleared, while allowing internal pending/shared transitions'
);

assert(
  router.includes('fallbackRoute') &&
    router.includes('path: "/:pathMatch(.*)*"') &&
    router.includes('redirect: {name: "main"}'),
  'fallback route must redirect to main'
);

assert(
  sharedPage.includes('ChatConversationWorkspace') &&
    sharedPage.includes('<ChatContainer>') &&
    sharedPage.includes('setWorkspaceRef'),
  'SharedPage must render the normal chat conversation workspace'
);

assert(
  sharedChat.includes('resolveSharedExists') &&
    sharedChat.includes('createSharedUnavailableResponse') &&
    sharedChat.includes('SHARED_API_UNAVAILABLE') &&
    !sharedChat.includes('createFallbackSharedConversation'),
  'shared URL validation must fail closed when response/API is unavailable'
);

assert(
  dataController.includes('getSharedEntryId') &&
    dataController.includes('redirectSharedNotFound') &&
    dataController.includes('setActiveSharedRoom') &&
    dataController.includes('router.replace({name: "shared"}') &&
    dataController.includes('if (!isCurrentLoad()) return') &&
    dataController.includes('finishHistoryRender()'),
  'shared entry load must validate, replace, avoid stale duplicate loads, and finish rendering'
);


assert(
  dataController.includes('isSharedChat(activeHistory.value)') &&
    dataController.includes('공유 URL 또는 sharedId가 있는 대화방'),
  'readonly mode must be based on sharedId/active shared room, not only /shared route'
);

assert(
  submit.includes('chatStore.isActiveSharedRoom') &&
    submit.includes('function shouldCreateConversation') &&
    submit.includes('if (targetHistoryId) return false'),
  'submit/regenerate must block shared rooms and preserve hidden-mode existing-chat submits'
);

assert(
  workspace.includes('ChatReadonlyInput v-if="readonly"') &&
    workspace.includes('function handleRegenerate') &&
    workspace.includes('readonly.value'),
  'workspace must show readonly input and block regenerate actions in readonly mode'
);


assert(
  chatContainer.includes('isHistoryRendering.value') &&
    chatContainer.includes('isReadOnly.value || isGenerating.value || isHistoryRendering.value'),
  'workspace actions must block submit/regenerate while history rendering is in progress'
);

assert(
  messageList.includes('readonly: {type: Boolean') &&
    messageList.includes(':show-regenerate="!readonly'),
  'MessageList must hide regenerate button in readonly mode'
);

assert(
  renderPolicy.includes('return hasSharedId(chat)') &&
    renderPolicy.includes('sharedId 존재 여부만 공유방 렌더 정책 기준') &&
    !renderPolicy.includes('chatTitle') &&
    !renderPolicy.includes('공유 - 테스트'),
  'shared chat render policy must use sharedId, not user-editable title text'
);

assert(
  chatResponseAdapter.includes('function optionalText') &&
    chatResponseAdapter.includes('sharedId: optionalText'),
  'chat adapters must normalize sharedId as a nonblank identifier, not infer sharing from title text'
);


assert(
  systemSettings.includes('showPcProgress') &&
    systemSettings.includes('showMobileProgress') &&
    systemSettings.includes('VUE_APP_SYSTEM_SHOW_PC_PROGRESS') &&
    systemSettings.includes('VUE_APP_SYSTEM_SHOW_MOBILE_PROGRESS'),
  'PC/Mobile ProgressBar settings must exist'
);

assert(
  progressPolicy.includes('resolveProgressPlatform') &&
    progressPolicy.includes('isProgressAllowedForCurrentPlatform') &&
    progressPolicy.includes('PLATFORM_OVERRIDE_MODES.androidChrome') &&
    progressPolicy.includes('PLATFORM_OVERRIDE_MODES.androidWebView') &&
    !progressPolicy.includes('isMobileLikeViewport'),
  'ProgressBar policy must use forced/actual platform, not viewport width'
);

assert(
  progressOverlay.includes('isProgressAllowedForCurrentPlatform') &&
    progressOverlay.includes('platformStore.info') &&
    !progressOverlay.includes('showMobileApiProgress'),
  'ProgressOverlay visibility must use platform-based PC/Mobile ProgressBar settings'
);

assert(
  apiRequestStore.includes('startProgress') &&
    apiRequestStore.includes('stopProgress') &&
    apiRequestStore.includes('clearProgress') &&
    apiRequestStore.includes('startOverlay()') &&
    apiRequestStore.includes('stopOverlay()'),
  'apiRequestStore must expose generic progress actions while keeping overlay compatibility methods'
);

assert(
  httpClient.includes('isProgressAllowedForCurrentPlatform') &&
    !httpClient.includes('isMobileLikeViewport'),
  'HTTP client progress overlay must use platform-based progress policy'
);

assert(
  streamRequest.includes('isProgressAllowedForCurrentPlatform') &&
    !streamRequest.includes('isMobileLikeViewport'),
  'SSE progress overlay must use platform-based progress policy'
);

console.log('url policy static checks passed');
