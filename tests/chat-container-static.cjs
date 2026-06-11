const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const container = read('src/containers/chat/ChatContainer.vue');
const providers = read('src/composables/chat/container/useChatContainerProviders.js');
const locks = read('src/composables/chat/container/useChatContainerInteractionLocks.js');

assert(
  container.includes('useChatContainerProviders({') &&
    container.includes('useChatContainerInteractionLocks({'),
  'ChatContainer must delegate provider wiring and interaction lock wiring to container composables'
);

assert(
  !container.includes('provideChatActions') &&
    !container.includes('provideChatWorkspaceState') &&
    !container.includes('providePromptState') &&
    !container.includes('provideWorkspaceActions'),
  'ChatContainer should not directly call Chat provider functions after step 8'
);

assert(
  providers.includes('provideChatActions') &&
    providers.includes('provideChatWorkspaceState') &&
    providers.includes('providePromptState') &&
    providers.includes('provideWorkspaceActions'),
  'Chat provider wiring must live in useChatContainerProviders'
);

assert(
  locks.includes('useChatPageLock({') &&
    locks.includes('readonly: isReadOnly') &&
    !locks.includes('readonly: isReadOnly,\n    readonly: isReadOnly'),
  'Chat page lock wiring must live in useChatContainerInteractionLocks without duplicate readonly keys'
);

console.log('chat container static checks passed');
