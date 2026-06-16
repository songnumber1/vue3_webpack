const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function assertContains(file, snippets) {
  const source = read(file);
  snippets.forEach((snippet) => {
    assert(source.includes(snippet), `${file} must include: ${snippet}`);
  });
}


function walkFiles(relativeDir, extensions = ['.js', '.vue']) {
  const base = path.join(root, relativeDir);
  const results = [];
  if (!fs.existsSync(base)) return results;
  const stack = [base];
  while (stack.length) {
    const current = stack.pop();
    const stat = fs.statSync(current);
    if (stat.isDirectory()) {
      fs.readdirSync(current).forEach((name) => stack.push(path.join(current, name)));
      continue;
    }
    if (extensions.includes(path.extname(current))) {
      results.push(path.relative(root, current).replace(/\\/g, '/'));
    }
  }
  return results;
}

function assertNoExternalDeepChatImports() {
  const publicConsumerRoots = [
    'src/components',
    'src/containers',
    'src/views',
    'src/core',
    'src/layouts',
  ];
  const blockedImports = [
    '@/composables/chat/internal/container/',
    '@/composables/chat/internal/message-list/',
    '@/composables/chat/internal/policy/',
    '@/composables/chat/internal/navigation/',
    '@/composables/chat/internal/route/',
  ];
  const violations = [];
  publicConsumerRoots
    .flatMap((dir) => walkFiles(dir))
    .forEach((file) => {
      const source = read(file);
      blockedImports.forEach((blocked) => {
        if (source.includes(blocked)) violations.push(`${file} imports ${blocked}`);
      });
    });
  assert(
    violations.length === 0,
    `external chat consumers must import public entrypoints instead of deep chat files:\n${violations.join('\n')}`,
  );
}

[
  'src/composables/chat/useChatHistory.js',
  'src/composables/chat/useChatScroll.js',
  'src/composables/chat/useChatRoute.js',
  'src/composables/chat/useChatUi.js',
  'src/composables/chat/useChatData.js',
].forEach((file) => {
  const source = read(file);
  assert(source.includes('@file composables/chat/'), `${file} must keep public entrypoint documentation`);
  assert(!source.includes('from "./'), `${file} should use absolute alias imports while the old folder structure remains`);
});

assertContains('src/composables/chat/useChatHistory.js', [
  'export {useChatHistoryState} from "@/composables/chat/internal/container/useChatHistoryState";',
  'export {useHistoryConversationLoader} from "@/composables/chat/history/useHistoryConversationLoader";',
  'export {useConversationLazyHistory} from "@/composables/chat/conversation/useConversationLazyHistory";',
  'export {createChatHistoryRuntime} from "@/composables/chat/runtime/useChatHistoryRuntime";',
]);

assertContains('src/composables/chat/useChatScroll.js', [
  'export {useAutoScroll} from "@/composables/chat/useAutoScroll";',
  'export {useChatScrollController} from "@/composables/chat/internal/container/useChatScrollController";',
  'export {useMessageListScroll} from "@/composables/chat/internal/message-list/useMessageListScroll";',
  'export {createMessageScrollTargetController} from "@/composables/chat/internal/message-list/useMessageScrollTarget";',
  'createStreamScrollScheduler,',
  'scrollAfterUserSubmit,',
]);

assertContains('src/composables/chat/useChatRoute.js', [
  'export {useChatRouteController} from "@/composables/chat/internal/route/useChatRouteController";',
  'export {useChatRouteLoader} from "@/composables/chat/internal/route/useChatRouteLoader";',
  'export {navigateToConversation} from "@/composables/chat/internal/navigation/conversationUrlPolicy";',
  'resolveHiddenConversationRoute,',
  'resolveConversationSessionState,',
]);

assertContains('src/composables/chat/useChatUi.js', [
  'export {useChatUIController} from "@/composables/chat/internal/container/useChatUIController";',
  'export {useChatMobileState} from "@/composables/chat/internal/container/useChatMobileState";',
  'export {useChatContainerProviders} from "@/composables/chat/internal/container/useChatContainerProviders";',
  'export {useConversationRenderLifecycle} from "@/composables/chat/conversation/useConversationRenderLifecycle";',
  'export {useChatStudioPortalActions} from "@/composables/chat/studio/useChatStudioPortalActions";',
]);

assertContains('src/composables/chat/useChatData.js', [
  'export {useChatDataController} from "@/composables/chat/internal/container/useChatDataController";',
]);

function assertTopLevelChatControllerUsesPublicEntrypoints() {
  const file = 'src/composables/chat/useChatContainerController.js';
  const source = read(file);
  [
    '@/composables/chat/internal/container/',
    '@/composables/chat/internal/policy/',
    '@/composables/chat/internal/navigation/',
    '@/composables/chat/internal/route/',
    '@/composables/chat/internal/message-list/',
  ].forEach((blocked) => {
    assert(
      !source.includes(blocked),
      `${file} should depend on chat public entrypoints instead of ${blocked}`,
    );
  });
  [
    'from "@/composables/chat/useChatData"',
    'from "@/composables/chat/useChatRoute"',
    'from "@/composables/chat/useChatUi"',
  ].forEach((snippet) => {
    assert(source.includes(snippet), `${file} must include: ${snippet}`);
  });
}

assertNoExternalDeepChatImports();
assertTopLevelChatControllerUsesPublicEntrypoints();

console.log('chat public entrypoint static checks passed');
