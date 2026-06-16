const fs = require('fs');
const path = require('path');
const assert = require('assert');

const root = path.resolve(__dirname, '..');
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');

const createPolish = read('src/assets/styles/studio/_create-polish.scss');
const createResponsive = read('src/assets/styles/studio/_create-responsive.scss');
const mobileMain = read('src/assets/styles/studio/_mobile-main.scss');

const assertOrdered = (source, markers, label) => {
  let previous = -1;
  for (const marker of markers) {
    const index = source.indexOf(marker);
    assert(index !== -1, `${label} must include section marker: ${marker}`);
    assert(index > previous, `${label} section marker order changed: ${marker}`);
    previous = index;
  }
};

assertOrdered(
  createPolish,
  [
    'Multi-select panel density',
    'Authority picker grid and controls',
    'Picker overlay controls',
    'Desktop create form alignment',
    'Mobile bottom-sheet option alignment',
    'Pagination and final create-page polish',
  ],
  '_create-polish.scss'
);

assertOrdered(
  createResponsive,
  [
    'Shared create controls and desktop preview',
    'Mobile create layout and safe-area guards',
    'Mobile tab and content scroll guards',
    'Desktop preview and Android keyboard stability guards',
    'Create/detail control normalization',
    'Mobile scroll and focus stability guards',
    'Final tab header and textarea paint guards',
  ],
  '_create-responsive.scss'
);

assertOrdered(
  mobileMain,
  [
    'Mobile Studio list shell and action entry',
    'Mobile category picker bottom sheet',
    'Mobile Studio sheet and pagination guards',
    'Mobile detail page and Android clipping guards',
    'Final mobile Studio alignment and scroll parity',
  ],
  '_mobile-main.scss'
);

assert(
  createPolish.includes('This file keeps the original Studio cascade slot and preserves declaration order.'),
  '_create-polish.scss must keep the cascade-preservation guard comment'
);
assert(
  createResponsive.includes('This file keeps the original Studio cascade slot and preserves declaration order.'),
  '_create-responsive.scss must keep the cascade-preservation guard comment'
);
assert(
  mobileMain.includes('This file keeps the original Studio cascade slot and preserves declaration order.'),
  '_mobile-main.scss must keep the cascade-preservation guard comment'
);

console.log('studio SCSS internal structure static checks passed');
