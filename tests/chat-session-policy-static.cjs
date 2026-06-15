const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}
function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const sessionPolicy = read('src/composables/chat/internal/policy/chatSessionPolicy.js');
const chatRuntime = read('src/composables/chat/useChatRuntime.js');
const chatContainer = read('src/containers/chat/ChatContainer.vue');
const studioPortalActions = read('src/composables/chat/studio/useChatStudioPortalActions.js');
const runAll = read('tests/run-all.cjs');

assert(
  runAll.includes("require('./chat-session-policy-static.cjs')"),
  'regression runner must include chat session policy checks'
);
assert(
  sessionPolicy.includes('export function resolveHistoryAssistantLabel') &&
    sessionPolicy.includes('export function resolveDeletedStudioSessionState') &&
    sessionPolicy.includes('export function markSessionAsMissingAssistant') &&
    sessionPolicy.includes('export function resolveConversationSessionState'),
  'chatSessionPolicy must expose session label, deleted studio, missing assistant, and session-state policies'
);
assert(
  chatRuntime.includes('resolveConversationSessionState({') &&
    chatRuntime.includes('chatStore.setActiveSession(resolvedSession)') &&
    !chatRuntime.includes('session.isModelUnavailable = true') &&
    !chatRuntime.includes('session.modelUnavailableReason = "missing-assistant"'),
  'useChatRuntime must delegate deleted/missing assistant session decisions to chatSessionPolicy'
);
assert(
  studioPortalActions.includes('markSessionAsMissingAssistant({') &&
    !studioPortalActions.includes('modelUnavailableReason: "missing-assistant",'),
  'Studio portal actions must use chatSessionPolicy when marking the current deleted Studio session unavailable'
);
assert(
  sessionPolicy.includes('studioRuntimeStore?.isStudioDeleted?.(assistantId)') &&
    sessionPolicy.includes('displayLabel: isDeleted ? resolveHistoryAssistantLabel(history, session) : ""') &&
    sessionPolicy.includes('nextSession.displayAssistantLabel = deletedStudio.displayLabel'),
  'deleted Studio sessions must preserve the original history assistant label in chatSessionPolicy'
);
assert(
  sessionPolicy.includes('nextSelectedAssistantId:') &&
    sessionPolicy.includes('!preserveSidebarAssistant') &&
    sessionPolicy.includes('!deletedStudio.displayLabel'),
  'session policy must keep existing desktop sidebar preservation and deleted Studio no-fallback behavior'
);

console.log('chat session policy checks passed');
