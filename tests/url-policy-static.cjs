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
const routePolicy = read('src/composables/chat/policy/chatRoutePolicy.js');
const router = read('src/core/resolver/router.js');
const routeNames = read('src/constants/routeNames.js');
const routeComponents = read('src/core/resolver/routeComponents.js');
const sharedPage = read('src/views/SharedPage.vue');
const sharedChat = read('src/composables/chat/useSharedChat.js');
const dataController = read('src/composables/chat/container/useChatDataController.js');
const historyLoader = read('src/composables/chat/history/useHistoryConversationLoader.js');
const renderLifecycle = read('src/composables/chat/conversation/useConversationRenderLifecycle.js');
const navigationLockStore = read('src/stores/navigationLockStore.js');
const navigationLock = read('src/composables/navigation/useNavigationLock.js');
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
  routeNames.includes('ROUTE_NAMES') &&
    routeNames.includes('CHAT_ENTRY') &&
    routeNames.includes('CHAT_DETAIL') &&
    routeNames.includes('SHARED') &&
    routeNames.includes('SHARED_ENTRY') &&
    routeNames.includes('LOGIN_REQUIRED') &&
    routeNames.includes('ANDROID_UPDATE'),
  'route names must be centralized in routeNames constants'
);


assert(
  routeComponents.includes('ROUTE_COMPONENTS') &&
    routeComponents.includes('ChatPage') &&
    routeComponents.includes('SharedPage') &&
    routeComponents.includes('LoginRequiredPage') &&
    routeComponents.includes('AndroidUpdate') &&
    !router.includes('const ChatPage = () =>') &&
    !router.includes('const SharedPage = () =>'),
  'route lazy components must be centralized in routeComponents, not declared in router.js'
);

assert(
  systemSettings.includes('CONVERSATION_URL_MODES') &&
    systemSettings.includes('conversationUrlMode') &&
    systemSettings.includes('visible') &&
    systemSettings.includes('hidden'),
  'conversationUrlMode visible/hidden system setting must exist'
);

assert(
  systemSettings.includes('process.env.VUE_APP_SYSTEM_CONVERSATION_URL_MODE') &&
    systemSettings.includes('CONVERSATION_URL_MODES.hidden'),
  'conversationUrlMode default must be hidden while visible remains available for development compatibility'
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
  routePolicy.includes('isHiddenConversationUrlMode') &&
    routePolicy.includes('resolveActiveChatId') &&
    routePolicy.includes('createConversationRoute') &&
    routePolicy.includes('resolveConversationUrlGuard') &&
    routePolicy.includes('resolveConversationRouteReconciliation') &&
    routePolicy.includes('applyHiddenConversationActiveRoom') &&
    routePolicy.includes('setActiveChatRoom'),
  'conversation URL visible/hidden route policy helpers must be centralized in chatRoutePolicy'
);

assert(
  urlPolicy.includes('navigateToConversation') &&
    urlPolicy.indexOf('await navigate.call(router, route)') <
      urlPolicy.lastIndexOf('applyHiddenConversationActiveRoom({chatId, chatStore, settings})'),
  'hidden URL mode must apply activeRoom after navigation attempt to avoid first-chat empty render race'
);

assert(
  router.includes('path: "shared"') &&
    router.includes('name: ROUTE_NAMES.SHARED') &&
    router.includes('path: "shared/:id"') &&
    router.includes('name: ROUTE_NAMES.SHARED_ENTRY'),
  'shared and shared-entry routes must exist through route name constants'
);


assert(
  router.includes('function guardConversationUrlMode') &&
    router.includes('resolveConversationUrlGuard({') &&
    routePolicy.includes('if (!hiddenMode && to?.name === ROUTE_NAMES.CHAT_ENTRY)') &&
    routePolicy.includes('name: ROUTE_NAMES.CHAT_DETAIL') &&
    routePolicy.includes('params: {id: activeChatRoomId}') &&
    routePolicy.includes('name: ROUTE_NAMES.MAIN'),
  'visible URL mode must restore bare /chat to /chat/:id through centralized chatRoutePolicy when activeRoom exists and otherwise redirect to main'
);

assert(
  historyLoader.includes('hasPendingHiddenNavigation') &&
    historyLoader.includes('router.replace({name: ROUTE_NAMES.MAIN}'),
  'history loader must guard bare /chat without active id and redirect hidden refresh/direct access to main'
);

assert(
  navigationLockStore.includes('NAVIGATION_LOCK_SCOPES') &&
    navigationLockStore.includes('chatHistory') &&
    navigationLockStore.includes('acquireIfFree') &&
    navigationLockStore.includes('releaseAll'),
  'navigationLockStore must keep a ProgressBar-independent chatHistory navigation lock'
);

assert(
  renderLifecycle.includes('beginHistoryRender') &&
    renderLifecycle.includes('navigationLock.acquireLockIfFree') &&
    renderLifecycle.includes('NAVIGATION_LOCK_SCOPES.chatHistory') &&
    renderLifecycle.includes('releaseCurrentChatHistoryLock'),
  'history render must lock navigation via navigationLockStore independently of ProgressBar'
);


assert(
  router.includes('isRouteGuardBypassRoute') &&
    !router.includes('Boolean(to.meta?.skipAuthCheck) ||') &&
    router.includes('to.name === ROUTE_NAMES.LOGIN_REQUIRED') &&
    router.includes('to.name === ROUTE_NAMES.ANDROID_UPDATE') &&
    router.indexOf('if (isRouteGuardBypassRoute(to)) return true;') < router.indexOf('const guardResults = ['),
  'login-required/update routes must bypass streaming/history navigation guards so forced logout can always redirect'
);

assert(
  systemSettingsView.includes('useChatStore') &&
    systemSettingsView.includes('useChatStreamStore') &&
    systemSettingsView.includes('useNavigationLockStore') &&
    systemSettingsView.includes('navigationLockStore.releaseAll()') &&
    systemSettingsView.includes('chatStore.clearActiveSession()') &&
    systemSettingsView.includes('chatStreamStore.finish()') &&
    systemSettingsView.includes('router') &&
    systemSettingsView.includes('login-required'),
  'policy-setting logout must clear chat locks/stream state before redirecting to login-required'
);

assert(
  router.includes('isAllowedHistoryLockNavigation') &&
    router.includes('guardHistoryNavigation') &&
    router.includes('navigationLockStore.isLocked(NAVIGATION_LOCK_SCOPES.chatHistory)') &&
    router.includes('getPendingSelectedChatId(chatStore)') &&
    router.includes('isPendingVisibleChatRoute') &&
    router.includes('isPendingHiddenChatRoute') &&
    router.includes('from?.name === ROUTE_NAMES.SHARED_ENTRY') &&
    router.includes('chatStore.isActiveSharedRoom'),
  'router guard must block user navigation during history rendering via navigationLockStore while allowing internal pending/shared transitions'
);

assert(
  dataController.includes('resolveConversationRouteReconciliation') &&
    dataController.includes('reconcileConversationUrlModeRoute') &&
    read('src/composables/chat/shared/useSharedConversationLoader.js').includes('await router.replace({name: ROUTE_NAMES.SHARED}') &&
    read('src/composables/chat/shared/useSharedConversationLoader.js').includes('setHistoryMessagesForInitialRender(result.messages)'),
  'chat/shared URL reconciliation must use centralized policy and shared URL must keep /shared/:id in visible mode and replace to /shared only in hidden mode'
);

assert(
  router.includes('fallbackRoute') &&
    router.includes('path: "/:pathMatch(.*)*"') &&
    router.includes('redirect: {name: ROUTE_NAMES.MAIN}'),
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
    read('src/composables/chat/shared/useSharedConversationLoader.js').includes('redirectSharedNotFound') &&
    read('src/composables/chat/shared/useSharedConversationLoader.js').includes('setActiveSharedRoom') &&
    read('src/composables/chat/shared/useSharedConversationLoader.js').includes('router.replace({name: ROUTE_NAMES.SHARED}') &&
    read('src/composables/chat/shared/useSharedConversationLoader.js').includes('if (!isCurrentLoad()) return') &&
    read('src/composables/chat/shared/useSharedConversationLoader.js').includes('finishHistoryRender()'),
  'shared entry load must validate, replace, avoid stale duplicate loads, and finish rendering'
);


assert(
  dataController.includes('isSharedChat(activeHistory.value)') &&
    dataController.includes('chatStore.isActiveSharedRoom'),
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
    workspace.includes(':readonly="readonly"'),
  'workspace must show readonly input and pass readonly mode to MessageList to block regenerate actions'
);


const containerProviders = read('src/composables/chat/container/useChatContainerProviders.js');

assert(
  containerProviders.includes('chatPageLock.isSubmitBlocked.value') &&
    containerProviders.includes('chatPageLock.isRegenerateBlocked.value') &&
    read('src/composables/chat/conversation/useChatPageLock.js').includes('isHistoryBusy') &&
    read('src/composables/chat/conversation/useChatPageLock.js').includes('isChatHistoryLocked.value'),
  'workspace actions must block submit/regenerate while history rendering or chat-history lock is in progress'
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


assert(
  router.includes('resolveConversationUrlGuard({') &&
    routePolicy.includes('to?.name === ROUTE_NAMES.CHAT_ENTRY') &&
    routePolicy.includes('getActiveChatRoomId(chatStore)') &&
    routePolicy.includes('!chatStreamStore?.isStreaming'),
  'hidden URL mode must redirect direct bare /chat to main through chatRoutePolicy when there is no active/pending chat room'
);


assert(
  router.includes('function guardSharedRoute') &&
    router.includes('to.name === ROUTE_NAMES.SHARED && !chatStore.isActiveSharedRoom'),
  'bare /shared must redirect to main unless an active shared room exists'
);


assert(
  renderLifecycle.includes('function finishHistoryRenderImmediately') &&
    read('src/composables/chat/shared/useSharedConversationLoader.js').includes('finishHistoryRenderImmediately();'),
  'shared not-found must immediately release history render lock before main redirect'
);

assert(
  router.includes('from?.name === ROUTE_NAMES.SHARED_ENTRY') &&
    router.includes('from?.name === ROUTE_NAMES.SHARED') &&
    router.includes('to.name === ROUTE_NAMES.MAIN') &&
    router.includes('!chatStore.isActiveSharedRoom'),
  'router guard must allow shared not-found fallback navigation to main while history lock is active'
);

assert(
  read('src/i18n/domains/chat.js').includes('공유방을 찾을 수 없습니다.') &&
    read('src/composables/chat/useSharedChat.js').includes('공유방을 찾을 수 없습니다.') &&
    read('src/composables/chat/shared/useSharedConversationLoader.js').includes('const message = t("chat.sharedNotFoundMessage")') &&
    read('src/composables/chat/shared/useSharedConversationLoader.js').includes('window.alert(message)') &&
    read('src/composables/chat/shared/useSharedConversationLoader.js').includes('router.replace({name: ROUTE_NAMES.MAIN}'),
  'shared not-found alert message must use the finalized Korean copy'
);

console.log('url policy static checks passed');
