#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const root = process.cwd();
function read(rel) {
  return fs.readFileSync(path.join(root, rel), 'utf8');
}
function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

const composer = read('src/components/prompt/PromptComposer.vue');
const scss = read('src/assets/styles/06-components/prompt/_prompt-composer.scss');

assert(
  composer.includes('v-if="!usesDesktopTopActions"') &&
    composer.includes('v-if="usesDesktopTopActions"'),
  'PromptComposer must render attachment preview in separate desktop/non-desktop positions.'
);
assert(
  composer.indexOf('class="prompt-desktop-top-row') <
    composer.indexOf('class="prompt-attachment-preview--desktop-top-actions"'),
  'Desktop attachment preview must be rendered after the top action row.'
);
assert(
  composer.indexOf('class="prompt-attachment-preview--desktop-top-actions"') <
    composer.indexOf('<PromptTextarea'),
  'Desktop attachment preview must remain above the textarea.'
);
assert(
  scss.includes('.prompt-box--desktop-top-actions.prompt-box--expanded') &&
    scss.includes('.prompt-model-menu') &&
    scss.includes('top: calc(100% + 10px) !important') &&
    scss.includes('bottom: auto !important'),
  'Expanded desktop model menu must open downward inside the prompt.'
);
assert(
  scss.includes('.prompt-attachment-preview--desktop-top-actions') &&
    scss.includes('order: 2'),
  'Desktop attachment preview must be ordered below top actions.'
);

console.log('prompt desktop top action placement static checks passed');
