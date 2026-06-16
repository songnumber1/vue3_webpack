const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const layoutConstants = read('src/constants/layout.js');
const themes = read('src/assets/styles/02-foundation/themes/_themes.scss');
const appFrame = read('src/assets/styles/05-layout/_application-frame.scss');
const tailwindTokens = read('src/assets/styles/tailwind/_tokens.scss');
const mainPromptState = read('src/composables/main/useMainPromptState.js');
const mainEmptyState = read('src/components/workspace/MainEmptyState.vue');
const promptDesktop = read('src/assets/styles/06-components/prompt/_prompt-desktop.scss');
const promptComposer = read('src/assets/styles/06-components/prompt/_prompt-composer.scss');
const promptBase = read('src/assets/styles/06-components/prompt/_prompt-base.scss');
const readonlyInput = read('src/assets/styles/06-components/chat/_readonly-input.scss');
const responsive = read('src/assets/styles/05-layout/_responsive.scss');
const codePanel = read('src/composables/chat/conversation/useCodeInterpreterPanel.js');

assert(
  layoutConstants.includes('prompt: 880') &&
    layoutConstants.includes('message: 880') &&
    layoutConstants.includes('chatLane: 880'),
  'JS layout constants must use the same 880px prompt/message/chat lane baseline'
);

assert(
  themes.includes('--layout-message-width: 880px;') &&
    themes.includes('--layout-prompt-width: 880px;') &&
    appFrame.includes('--layout-message-width: 880px;') &&
    appFrame.includes('--layout-prompt-width: 880px;'),
  'theme and desktop application frame CSS variables must share the 880px prompt/message baseline'
);

assert(
  tailwindTokens.includes('--tw-size-prompt: var(--layout-prompt-width, 880px);') &&
    tailwindTokens.includes('--tw-size-message: var(--layout-message-width, 880px);'),
  'Tailwind token aliases must fallback to the same 880px layout baseline'
);

assert(
  !mainPromptState.includes('layout-prompt-width,820px') &&
    !mainEmptyState.includes('tw-max-w-[820px]') &&
    mainPromptState.includes('layout-prompt-width,880px') &&
    mainEmptyState.includes('tw-max-w-[var(--layout-prompt-width,880px)]'),
  'main screen prompt wrapper must not keep hard-coded 820px width fallbacks'
);

for (const [name, content] of [
  ['desktop prompt', promptDesktop],
  ['prompt composer', promptComposer],
  ['prompt base', promptBase],
  ['readonly input', readonlyInput],
  ['desktop responsive', responsive],
]) {
  assert(!content.includes('var(--layout-prompt-width, 820px)'), `${name} must not fallback prompt width to 820px`);
  assert(!content.includes('width: min(100%, 820px)'), `${name} must not hard-code prompt width to 820px`);
  assert(!content.includes('max-width: 820px'), `${name} must not hard-code max prompt width to 820px`);
}

assert(
  promptComposer.includes('width: min(100%, var(--layout-prompt-width, 880px));') &&
    promptComposer.includes('width: min(var(--layout-prompt-width, 880px), calc(100vw - 420px));') &&
    promptBase.includes('max-width: var(--layout-prompt-width, 880px);') &&
    readonlyInput.includes('max-width: var(--layout-prompt-width, 880px);'),
  'prompt/read-only input width fallbacks must be tied to --layout-prompt-width with 880px fallback'
);

assert(
  codePanel.includes('LAYOUT_WIDTH.chatLane') &&
    codePanel.includes('LAYOUT_WIDTH.minCodePanelChat') &&
    !codePanel.includes('880') &&
    !codePanel.includes('420'),
  'code interpreter runtime width math must consume centralized JS layout constants'
);

console.log('layout width static checks passed');
