const fs = require('fs');
const path = require('path');

const root = process.cwd();
const srcRoot = path.join(root, 'src');
const requiredFiles = [
  'src/composables/chat/context/chatContextKeys.js',
  'src/composables/chat/context/useChatProvider.js',
  'src/composables/chat/context/useChatInject.js',
];

for (const file of requiredFiles) {
  if (!fs.existsSync(path.join(root, file))) {
    throw new Error(`missing chat context file: ${file}`);
  }
}

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, {withFileTypes: true})) {
    if (entry.name === 'node_modules' || entry.name === 'dist') continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(fullPath, out);
    else if (/\.(vue|js)$/.test(entry.name)) out.push(fullPath);
  }
  return out;
}

const files = walk(srcRoot);
const allowedDirectVueContext = new Set([
  'src/composables/chat/context/useChatProvider.js',
  'src/composables/chat/context/useChatInject.js',
  'src/core/bootstrap.js',
  'src/containers/AppContainer.vue',
  'src/components/layout/ApplicationHeader.vue',
  'src/components/navigation/controls/SidebarUserFooter.vue',
  'src/composables/app/useAppContext.js',
  'src/composables/app/responsiveContext.js',
  'src/composables/chat/header/useChatHeaderActions.js',
]);

for (const file of files) {
  const rel = path.relative(root, file).replace(/\\/g, '/');
  const source = fs.readFileSync(file, 'utf8');
  const hasDirectProvideInject = /\b(provide|inject)\s*\(/.test(source);
  if (hasDirectProvideInject && !allowedDirectVueContext.has(rel)) {
    throw new Error(`direct provide/inject should use context composable: ${rel}`);
  }
}

const chatContainer = fs.readFileSync(
  path.join(root, 'src/containers/chat/ChatContainer.vue'),
  'utf8'
);
const chatContainerProviders = fs.readFileSync(
  path.join(root, 'src/composables/chat/container/useChatContainerProviders.js'),
  'utf8'
);
if (
  !chatContainer.includes('useChatContainerProviders({') ||
  !chatContainerProviders.includes('provideChatActions') ||
  !chatContainerProviders.includes('provideChatWorkspaceState')
) {
  throw new Error('ChatContainer must provide chat context through useChatContainerProviders');
}

const promptComposer = fs.readFileSync(
  path.join(root, 'src/components/prompt/PromptComposer.vue'),
  'utf8'
);
if (!promptComposer.includes('providePromptTextareaState') || !promptComposer.includes('providePromptToolbarState')) {
  throw new Error('PromptComposer must provide prompt child context through useChatProvider helpers');
}

console.log('chat context static checks passed');
