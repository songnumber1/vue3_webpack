const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const read = (relativePath) =>
  fs.readFileSync(path.join(root, relativePath), 'utf8');
const assert = (condition, message) => {
  if (!condition) {
    throw new Error(message);
  }
};

const toolbar = read('src/components/prompt/controls/PromptToolbarDesktop.vue');
const composerScss = read('src/assets/styles/06-components/prompt/_prompt-composer.scss');

[
  'Props and emits',
  'Local refs and floating menu positioning',
  'Context-backed toolbar state',
  'Computed state',
  'Tool menu handlers',
  'Floating submenu placement handlers',
  'Watchers',
  'Public component contract',
].forEach((section) => {
  assert(toolbar.includes(section), `PromptToolbarDesktop.vue must keep the ${section} section marker`);
});

assert(
  toolbar.includes('const LAYOUT_MODES = Object.freeze') &&
    toolbar.includes('const TOOL_MENU_FLOATING_OFFSET = 10') &&
    toolbar.includes('const TOOL_SUBMENU_WIDTH = 248'),
  'PromptToolbarDesktop.vue must lift repeated layout/menu literals into local constants'
);

const computedIndex = toolbar.indexOf('Computed state');
const handlersIndex = toolbar.indexOf('Tool menu handlers');
const watchersIndex = toolbar.indexOf('Watchers');
const publicIndex = toolbar.indexOf('Public component contract');
assert(
  computedIndex > -1 &&
    handlersIndex > computedIndex &&
    watchersIndex > handlersIndex &&
    publicIndex > watchersIndex,
  'PromptToolbarDesktop.vue must keep computed, handlers, watchers, and public contract sections in order'
);

[
  'Prompt layout foundations',
  'Floating menu base',
  'Gemini-style composer shell',
  'Composer action row',
  'Composer icon and primary action controls',
  'Send button and loading spinner',
  'Tool and attach menus',
  'Voice controls',
  'Mobile expand controls',
  'Expanded textarea and attachment preview',
].forEach((section) => {
  assert(composerScss.includes(section), `_prompt-composer.scss must keep the ${section} section marker`);
});

assert(
  !composerScss.includes('.prompt-icon-action,\n//') &&
    !composerScss.includes('.prompt-expand-toggle,\n//'),
  '_prompt-composer.scss section markers must not be inserted inside selector lists'
);

console.log('large file internal structure static checks passed');
