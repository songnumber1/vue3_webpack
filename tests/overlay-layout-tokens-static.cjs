const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const themes = read('src/assets/styles/02-foundation/themes/_themes.scss');
const shell = read('src/assets/styles/05-layout/chat/_shell.scss');
const assistantBottomSheet = read('src/assets/styles/05-layout/chat/_assistant-empty-bottom-sheet.scss');
const dialogViewport = read('src/assets/styles/06-components/dialog/_dialog-viewport.scss');
const systemSettingsDialog = read('src/assets/styles/06-components/dialog/_system-settings-dialog.scss');
const responsiveOverlay = read('src/assets/styles/06-components/overlay/_responsive-overlay.scss');
const authorityPicker = read('src/assets/styles/studio/_authority-picker.scss');
const studioCreatePolish = read('src/assets/styles/studio/_create-polish.scss');
const studioOverlays = read('src/assets/styles/studio/_overlays.scss');
const mcpMainWorkspace = read('src/components/mcp/McpMainWorkspace.vue');
const studioDetailViewer = read('src/components/studio/StudioDetailViewer.vue');

for (const token of [
  '--layout-dialog-max-height: 760px;',
  '--layout-system-dialog-height: 760px;',
  '--layout-responsive-overlay-max-height: 760px;',
  '--layout-studio-modal-width: 760px;',
  '--layout-studio-modal-height: 760px;',
  '--layout-studio-authority-max-height: 820px;',
  '--layout-assistant-bottom-sheet-width: 760px;',
  '--layout-chat-empty-state-width: 760px;',
]) {
  assert(themes.includes(token), `theme layout token missing: ${token}`);
}

for (const [name, content, hardcodedPatterns] of [
  ['chat shell', shell, ['min(760px, calc(100% - 40px))']],
  ['assistant bottom sheet', assistantBottomSheet, ['min(760px, 100%)', 'min(100%, 760px)']],
  ['dialog viewport', dialogViewport, ['min(760px, calc(100vh - 56px))']],
  ['system settings dialog', systemSettingsDialog, ['min(760px, calc(100vh - 56px))', 'min(760px, calc(var(--app-height, 100vh) - 48px))']],
  ['responsive overlay', responsiveOverlay, ['min(760px, calc(100vh - 56px))']],
  ['authority picker', authorityPicker, ['min(760px, calc(100vw - 48px))', 'min(820px, calc(100vh - 48px))']],
  ['studio create polish', studioCreatePolish, ['min(760px, calc(100vw - 48px))']],
  ['studio overlays', studioOverlays, ['min(760px, calc(100vh - 48px))']],
  ['mcp main workspace', mcpMainWorkspace, ['tw-w-[min(760px,calc(100vw-32px))]']],
  ['studio detail viewer', studioDetailViewer, ['min(760px, calc(100vw - 32px))']],
]) {
  for (const pattern of hardcodedPatterns) {
    assert(!content.includes(pattern), `${name} must use semantic layout tokens instead of ${pattern}`);
  }
}

assert(
  shell.includes('var(--layout-chat-empty-state-width, 760px)') &&
    assistantBottomSheet.includes('var(--layout-assistant-bottom-sheet-width, 760px)') &&
    dialogViewport.includes('var(--layout-dialog-max-height, 760px)') &&
    systemSettingsDialog.includes('var(--layout-system-dialog-height, 760px)') &&
    responsiveOverlay.includes('var(--layout-responsive-overlay-max-height, 760px)') &&
    authorityPicker.includes('var(--layout-studio-modal-width, 760px)') &&
    authorityPicker.includes('var(--layout-studio-authority-max-height, 820px)') &&
    studioCreatePolish.includes('var(--layout-studio-modal-width, 760px)') &&
    studioOverlays.includes('var(--layout-studio-modal-height, 760px)') &&
    mcpMainWorkspace.includes('var(--layout-studio-modal-width,760px)') &&
    studioDetailViewer.includes('var(--layout-studio-modal-width, 760px)'),
  'dialog/studio/overlay layout dimensions must be tied to semantic layout tokens with unchanged fallbacks'
);

console.log('overlay layout token static checks passed');
