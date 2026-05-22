const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const indexCss = read('src/assets/styles/index.css');
const main = read('src/main.js');
const typography = read('src/assets/styles/foundations/typography/responsive-typography.css');
const sidebar = read('src/assets/styles/layouts/sidebar/sidebar-assistant-polish.css');

assert(
  !indexCss.includes('components/debug/virtual-keyboard-debug.css'),
  'virtual keyboard debug CSS must not be imported by index.css'
);
assert(
  main.includes('process.env.NODE_ENV === "development"') &&
    main.includes('virtual-keyboard-debug.css'),
  'virtual keyboard debug CSS should be loaded only in development from main.js'
);
assert(
  !typography.includes('.system-settings-view') &&
    !typography.includes('.responsive-overlay--mobile-dialog') &&
    !typography.includes('.mobile-api-progress-overlay'),
  'responsive typography must remain focused on font tokens and base text rules'
);
assert(
  !sidebar.includes('env(safe-area-inset-bottom, 0px)') &&
    !sidebar.includes('height: var(--app-height, 100dvh) !important;'),
  'mobile drawer footer stability rules must stay isolated outside sidebar visual polish'
);
assert(
  indexCss.includes('mobile-drawer-footer-stability.css') &&
    indexCss.includes('dialog-control-normalization.css') &&
    indexCss.includes('dialog-viewport-policy.css') &&
    indexCss.includes('system-settings-dialog.css'),
  'freeze CSS split files must be imported explicitly'
);

console.log('freeze CSS policy checks passed');
