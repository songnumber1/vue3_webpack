const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const composerPath = path.join(root, 'src/components/prompt/PromptComposer.vue');
const promptComposerPath = path.join(root, 'src/composables/prompt/usePromptComposer.js');
const textareaPath = path.join(root, 'src/components/prompt/controls/PromptTextarea.vue');
const desktopToolbarPath = path.join(root, 'src/components/prompt/controls/PromptToolbarDesktop.vue');
const mobileToolbarPath = path.join(root, 'src/components/prompt/controls/PromptToolbarMobile.vue');
const studioPreviewPath = path.join(root, 'src/components/studio/StudioPreview.vue');
const runAllPath = path.join(root, 'tests/run-all.cjs');

function read(file) {
  return fs.readFileSync(file, 'utf8');
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const composer = read(composerPath);
const composable = read(promptComposerPath);
const textarea = read(textareaPath);
const desktopToolbar = read(desktopToolbarPath);
const mobileToolbar = read(mobileToolbarPath);
const studioPreview = read(studioPreviewPath);

assert(
  composer.includes('submitDisabled: {type: Boolean, default: false}'),
  'PromptComposer must expose submitDisabled prop'
);
assert(
  composer.includes('get submitDisabled()') && composer.includes('componentProps.submitDisabled'),
  'PromptComposer must forward submitDisabled into prompt composer state'
);
assert(
  composer.includes('if (componentProps.submitDisabled) return;') &&
    composer.indexOf('if (componentProps.submitDisabled) return;') < composer.indexOf('workspaceActions.submit(payload)'),
  'PromptComposer must guard injected workspace submit when submitDisabled is true'
);
assert(
  composable.includes('!props.submitDisabled') && composable.includes('props.submitDisabled ||'),
  'usePromptComposer must disable canSubmit and final submit when submitDisabled is true'
);
assert(
  textarea.includes('!canSubmit.value') && desktopToolbar.includes('!canSubmit') && mobileToolbar.includes('!canSubmit'),
  'PromptTextarea and toolbars must keep using canSubmit so disabled submit propagates to Enter and send buttons'
);
assert(
  studioPreview.includes('import PromptComposer from "@/components/prompt/PromptComposer.vue"') &&
    studioPreview.includes('<PromptComposer') &&
    studioPreview.includes('submit-disabled'),
  'StudioPreview must render the real PromptComposer with submit-disabled'
);

assert(
  composer.includes('hideToolActions: {type: Boolean, default: false}') &&
    composer.includes('hideAttachActions: {type: Boolean, default: false}') &&
    composer.includes('hideVoiceAction: {type: Boolean, default: false}'),
  'PromptComposer must expose preview-safe toolbar hiding props'
);
assert(
  composer.includes('hideToolActions: componentProps.hideToolActions') &&
    composer.includes('hideAttachActions: componentProps.hideAttachActions') &&
    composer.includes('hideVoiceAction: componentProps.hideVoiceAction'),
  'PromptComposer must provide toolbar hiding flags to toolbar state'
);
assert(
  desktopToolbar.includes('v-if="!hideToolActions"') &&
    desktopToolbar.includes('v-if="!hideAttachActions"') &&
    mobileToolbar.includes('v-if="!hideToolActions"') &&
    mobileToolbar.includes('v-if="!hideAttachActions"'),
  'desktop/mobile prompt toolbars must hide tool and attach actions when preview flags are set'
);
assert(
  studioPreview.includes('hide-tool-actions') &&
    studioPreview.includes('hide-attach-actions') &&
    studioPreview.includes('hide-voice-action'),
  'StudioPreview must hide tools, attachments, and voice actions on the real PromptComposer'
);

assert(
  studioPreview.includes('disable-interactions'),
  'StudioPreview suggestions must remain interaction-disabled'
);

const runAll = read(runAllPath);
assert(
  runAll.includes("require('./prompt-submit-disabled-static.cjs')"),
  'run-all must include prompt submit disabled static check'
);

console.log('prompt submit disabled static checks passed');
