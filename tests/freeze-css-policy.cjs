const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');

function exists(relativePath) {
  return fs.existsSync(path.join(root, relativePath));
}

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const indexScss = read('src/assets/styles/index.scss');
const main = read('src/main.js');
const tailwindIndex = read('src/assets/styles/tailwind/index.scss');
const tailwindTokens = read('src/assets/styles/tailwind/_tokens.scss');
const tailwindConfig = read('tailwind.config.js');

const applicationFrame = read('src/assets/styles/05-layout/_application-frame.scss');
const desktopClipboardNote = read('src/components/overlay/DesktopClipboardNote.vue');
const mobileClipboardToast = read('src/components/overlay/MobileClipboardToast.vue');

const removedTailwindLayers = [
  'src/assets/styles/tailwind/_base.scss',
  'src/assets/styles/tailwind/_components.scss',
  'src/assets/styles/tailwind/_utilities.scss',
];

for (const removedPath of removedTailwindLayers) {
  assert(!exists(removedPath), `${removedPath} must stay removed after Step 4-4`);
}

const archivedRemovedLayers = [
  'doc/tailwind-migration/removed-step4-2/tailwind_base.scss.removed',
  'doc/tailwind-migration/removed-step4-2/tailwind_components.scss.removed',
  'doc/tailwind-migration/removed-step4-2/tailwind_utilities.scss.removed',
];

for (const archivePath of archivedRemovedLayers) {
  assert(exists(archivePath), `${archivePath} should preserve the removed Step 4-2 source for audit`);
}

assert(
  tailwindIndex.includes('@tailwind base') &&
    tailwindIndex.includes('@tailwind utilities') &&
    tailwindIndex.includes('@import "./tokens"'),
  'Tailwind entry must expose only Tailwind base/utilities and the token bridge in Step 4-4'
);
assert(
  !tailwindIndex.includes('./base') &&
    !tailwindIndex.includes('./components') &&
    !tailwindIndex.includes('./utilities'),
  'Removed Tailwind layer partials must not be imported again'
);
assert(
  tailwindConfig.includes("prefix: 'tw-'") &&
    tailwindConfig.includes('preflight: false') &&
    tailwindConfig.includes("strategy: 'class'"),
  'Tailwind must keep prefix/preflight/forms class strategy safeguards'
);
assert(
  tailwindTokens.includes('--tw-color-bg') && tailwindTokens.includes('--tw-radius-dialog'),
  'Tailwind token bridge must keep before_front token aliases'
);
assert(
  !indexScss.includes('virtual-keyboard-debug.scss'),
  'virtual keyboard debug SCSS must not be imported by index.scss'
);
assert(
  main.includes('process.env.NODE_ENV === "development"') &&
    main.includes('virtual-keyboard-debug.scss'),
  'virtual keyboard debug SCSS should remain development-only from main.js'
);

assert(
  !exists('src/assets/styles/06-components/mobile/_mobile-api-progress.scss') &&
    exists('doc/tailwind-migration/removed-step4-3/_mobile-api-progress.scss'),
  'mobile-api-progress SCSS should be removed and archived in Step 4-4'
);
assert(
  !indexScss.includes('./06-components/mobile/mobile-api-progress'),
  'mobile-api-progress SCSS must not be imported after Step 4-4'
);
assert(
  !applicationFrame.includes('application-header__brand') &&
    !applicationFrame.includes('application-footer {\n  min-height') &&
    applicationFrame.includes('application-header .user-menu-panel'),
  'application-frame SCSS should drop header/footer visual shell while keeping menu layering'
);
assert(
  desktopClipboardNote.includes('Layout/visual shell is owned by tw-* utilities') &&
    !desktopClipboardNote.includes('.desktop-clipboard-note {\n  position: fixed'),
  'DesktopClipboardNote should keep only transition/mobile fallback SCSS after Step 4-4'
);
assert(
  mobileClipboardToast.includes('Only Vue transition states remain here') &&
    mobileClipboardToast.includes('-tw-translate-x-1/2') &&
    !mobileClipboardToast.includes('.mobile-clipboard-toast {\n  position: fixed'),
  'MobileClipboardToast should keep transform/visual shell in tw-* utilities after Step 4-4'
);

assert(
  indexScss.includes('./studio/studio-workspace') &&
    indexScss.includes('./06-components/bottom-sheet/bottom-sheet') &&
    indexScss.includes('./06-components/dialog/dialog-control') &&
    indexScss.includes('./03-runtime/viewport-keyboard'),
  'Step 4-4 must not remove Studio/BottomSheet/Dialog/keyboard runtime SCSS yet'
);




const step44StyleArchives = [
  'src__components__chat__ChatLayout.vue.style.scss',
  'src__components__chat__ChatMessage.vue.style.scss',
  'src__components__chat__UserMessage.vue.style.scss',
  'src__components__chat__AssistantMessage.vue.style.scss',
  'src__components__navigation__controls__SidebarHistoryList.vue.style.scss',
  'src__components__prompt__controls__PromptTextarea.vue.style.scss',
  'src__components__prompt__controls__PromptModelSelector.vue.style.scss',
];
for (const archiveName of step44StyleArchives) {
  assert(
    exists(`doc/tailwind-migration/removed-step4-4/${archiveName}`),
    `Step 4-4 removed scoped SCSS archive is missing: ${archiveName}`
  );
}
const step44StyleOwners = [
  'src/components/chat/ChatLayout.vue',
  'src/components/chat/ChatMessage.vue',
  'src/components/chat/UserMessage.vue',
  'src/components/chat/AssistantMessage.vue',
  'src/components/navigation/controls/SidebarHistoryList.vue',
  'src/components/prompt/controls/PromptTextarea.vue',
  'src/components/prompt/controls/PromptModelSelector.vue',
];
for (const ownerPath of step44StyleOwners) {
  assert(!read(ownerPath).includes('<style scoped lang="scss">'), `${ownerPath} should not keep its removed Step 4-4 scoped SCSS`);
}
assert(
  read('src/components/navigation/controls/SidebarHistoryList.vue').includes("[containerClass, 'tw-min-w-0']") &&
    read('src/components/prompt/controls/PromptTextarea.vue').includes('tw-min-h-[38px]') &&
    read('src/components/prompt/controls/PromptModelSelector.vue').includes('tw-box-border'),
  'Step 4-4 component scoped guards should be replaced by explicit tw-* utilities'
);

console.log('Step 4-4 Sass policy checks passed');
