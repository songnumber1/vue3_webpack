const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const indexScss = read('src/assets/styles/index.scss');
const main = read('src/main.js');
const typography = read('src/assets/styles/02-foundation/_typography.scss');
const sidebar = read('src/assets/styles/05-layout/_sidebar.scss');

assert(
  !indexScss.includes('virtual-keyboard-debug.scss'),
  'virtual keyboard debug SCSS must not be imported by index.scss'
);
assert(
  main.includes('process.env.NODE_ENV === "development"') &&
    main.includes('virtual-keyboard-debug.scss'),
  'virtual keyboard debug SCSS should be loaded only in development from main.js'
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
  indexScss.includes('sidebar-mobile') &&
    indexScss.includes('dialog-control') &&
    indexScss.includes('dialog-viewport') &&
    indexScss.includes('system-settings-dialog'),
  'freeze Sass split files must be imported explicitly'
);

console.log('freeze Sass policy checks passed');
