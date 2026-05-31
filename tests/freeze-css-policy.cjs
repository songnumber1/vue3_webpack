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
const tailwindTokens = read('src/assets/styles/tailwind/_tokens.scss');
const tailwindBase = read('src/assets/styles/tailwind/_base.scss');
const tailwindComponents = read('src/assets/styles/tailwind/_components.scss');

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
  tailwindTokens.includes('Step 5-9: typography tokens') &&
    tailwindTokens.includes('--dialog-radius') &&
    tailwindBase.includes('--app-height: 100vh'),
  'base typography and dialog tokens must be owned by Tailwind token/base layers after Step 5-9'
);
assert(
  tailwindComponents.includes('Step 5-7 header/sidebar cleanup') &&
    indexScss.includes('High fidelity visual parity layer from the pre-Tailwind baseline') &&
    indexScss.includes('./05-layout/sidebar"') &&
    indexScss.includes('./05-layout/header"') &&
    !indexScss.includes('./05-layout/application-frame"'),
  'header/sidebar visual parity may be restored through the high fidelity layer, but application-frame must remain excluded'
);
assert(
  indexScss.includes('sidebar-mobile') &&
    indexScss.includes('bottom-sheet') &&
    indexScss.includes('markdown') &&
    indexScss.includes('dialog-control') &&
    indexScss.includes('dialog-viewport') &&
    indexScss.includes('system-settings-dialog') &&
    !indexScss.includes('./studio/studio-workspace') &&
    tailwindComponents.includes('Step 5-9: final legacy import cleanup') &&
    tailwindComponents.includes('Step 5-11: Studio/MCP/RAG Tailwind-owned visual parity'),
  'runtime/platform imports must stay in index.scss, while Studio/MCP visual parity must be owned by Tailwind component layer'
);

console.log('freeze Sass policy checks passed');
