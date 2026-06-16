const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const mainEmptyPath = path.join(root, 'src/components/workspace/MainEmptyState.vue');
const runAllPath = path.join(root, 'tests/run-all.cjs');
const studioPreviewPath = path.join(root, 'src/components/studio/StudioPreview.vue');
const studioPreviewSource = fs.readFileSync(studioPreviewPath, 'utf8');

const source = fs.readFileSync(mainEmptyPath, 'utf8');

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

const composerIndex = source.indexOf('<slot v-if="!isMobile" name="composer"></slot>');
const suggestionsIndex = source.indexOf('class="suggestion-row suggestion-row--between main-empty-state__suggestions');

assert(composerIndex !== -1, 'desktop composer slot must exist in MainEmptyState');
assert(suggestionsIndex !== -1, 'suggestions block must exist in MainEmptyState');
assert(
  composerIndex < suggestionsIndex,
  'desktop composer slot must be rendered before suggestions on the PC main screen'
);

assert(
  source.includes("'main-empty-state__suggestions--desktop-list': !isMobile"),
  'desktop suggestions list class must be applied to PC main and Studio preview states'
);

assert(
  source.includes('body.desktop-mode') &&
    source.includes('.chat-container-root--mode-main') &&
    source.includes('.main-empty-state__suggestions--desktop-list'),
  'desktop suggestions styles must be restricted to the PC main route'
);

assert(
  source.includes('display: flex !important;') &&
    source.includes('grid-template-columns: none !important;') &&
    source.includes('flex-direction: column !important;'),
  'PC suggestions must override global grid rules and render one suggestion per row'
);

assert(
  source.includes('.desktop-center-prompt') && source.includes('order: 10 !important;'),
  'PC composer must have an explicit order before desktop suggestions'
);

assert(
  source.includes('order: 20 !important;'),
  'PC suggestions must have an explicit order after the composer'
);


assert(
  source.includes('composerExpanded: {type: Boolean, default: false}'),
  'MainEmptyState must accept composerExpanded prop for class-based expanded fallback'
);

assert(
  source.includes("'main-empty-state--composer-expanded': composerExpanded"),
  'MainEmptyState must expose composer expanded state as a class'
);

assert(
  source.includes('.main-empty-state--composer-expanded') &&
    source.includes('.main-empty-state__suggestions') &&
    source.includes('display: none !important;'),
  'PC main expanded state must hide suggestions without relying only on :has()'
);


assert(
  source.includes('.main-empty-state--preview .main-empty-state__suggestions') &&
    source.includes('.main-empty-state--preview .suggestion-chip') &&
    source.includes('width: 100% !important;'),
  'Studio preview suggestions must render one prompt per row like PC main'
);

assert(
  source.includes('.main-empty-state--preview .main-empty-state__suggestions'),
  'Studio preview suggestion styles must remain present'
);

assert(
  studioPreviewSource.includes('.studio-preview-prompt {') &&
    studioPreviewSource.includes('order: 10 !important;'),
  'Studio preview prompt must be explicitly ordered before preview suggestions'
);

assert(
  studioPreviewSource.includes('.main-empty-state__suggestions {') &&
    studioPreviewSource.includes('order: 20 !important;'),
  'Studio preview suggestions must be explicitly ordered after the prompt'
);

assert(
  source.includes('.empty-stage--mobile-main .main-empty-state__composer-dock'),
  'mobile composer dock must remain present'
);

const runAll = fs.readFileSync(runAllPath, 'utf8');
assert(
  runAll.includes("require('./main-empty-state-desktop-order-static.cjs')"),
  'run-all must include the main empty state desktop order static check'
);

console.log('main empty state desktop order static checks passed');
