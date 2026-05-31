const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');

function walk(dir, result = []) {
  for (const entry of fs.readdirSync(dir)) {
    if (entry === 'node_modules' || entry === 'dist') continue;
    const fullPath = path.join(dir, entry);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) walk(fullPath, result);
    else result.push(fullPath);
  }
  return result;
}

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const sourceFiles = walk(path.join(root, 'src')).filter((file) => /\.(vue|js)$/.test(file));
const tailwindFiles = walk(path.join(root, 'src/assets/styles/tailwind')).filter((file) => file.endsWith('.scss'));

const usedAliases = new Set();
for (const file of sourceFiles) {
  const content = fs.readFileSync(file, 'utf8');
  for (const match of content.matchAll(/\btw-[A-Za-z0-9_-]+(?:--[A-Za-z0-9_-]+)?/g)) {
    usedAliases.add(match[0]);
  }
}

const definedAliases = new Set();
for (const file of tailwindFiles) {
  const content = fs.readFileSync(file, 'utf8');
  for (const match of content.matchAll(/\.((?:tw-)[A-Za-z0-9_-]+(?:--[A-Za-z0-9_-]+)?)/g)) {
    definedAliases.add(match[1]);
  }
}

const undefinedAliases = [...usedAliases].filter((alias) => !definedAliases.has(alias)).sort();
assert(
  undefinedAliases.length === 0,
  `Undefined Tailwind alias classes found: ${undefinedAliases.join(', ')}`
);

const indexScss = read('src/assets/styles/index.scss');
const allowedLegacyImports = [
  './02-foundation/tokens/z-index.tokens',
  './02-foundation/tokens/radius.tokens',
  './02-foundation/themes/themes',
  './02-foundation/themes/spring.theme',
  './02-foundation/themes/summer.theme',
  './02-foundation/themes/autumn.theme',
  './02-foundation/themes/winter.theme',
  './00-abstracts/overlay-scrollbar',
  './05-layout/chat-core',
  './06-components/markdown/markdown',
  './06-components/bottom-sheet/bottom-sheet',
  './06-components/prompt/prompt-mobile-runtime',
  './03-runtime/keyboard',
  './99-legacy/responsive-keyboard-extracted-patches',
  './03-runtime/mobile-mode',
  './03-runtime/safe-area',
  './03-runtime/viewport-keyboard',
  './03-runtime/scroll-lock',
  './03-runtime/bottom-sheet-runtime',
  './04-platform/android-chrome-webview',
  './05-layout/chat-mobile',
  './05-layout/sidebar-mobile',
  './08-state/interaction',
  './05-layout/responsive',
  './05-layout/sidebar',
  './05-layout/header',
  './06-components/assistant/assistant-icon',
  './search/chat-search',
  './06-components/dialog/feedback-dialog',
  './06-components/dialog/dialog-control',
  './06-components/dialog/dialog-viewport',
  './06-components/dialog/system-settings-dialog',
];

const legacyImports = [...indexScss.matchAll(/@use\s+"([^"]+)"/g)].map((match) => match[1]);
const unexpectedImports = legacyImports.filter((item) => !allowedLegacyImports.includes(item));
const missingRequiredImports = allowedLegacyImports.filter((item) => !legacyImports.includes(item));

assert(
  unexpectedImports.length === 0,
  `Unexpected legacy SCSS imports found after Tailwind freeze: ${unexpectedImports.join(', ')}`
);
assert(
  missingRequiredImports.length === 0,
  `Required runtime/platform SCSS imports are missing: ${missingRequiredImports.join(', ')}`
);

const removedImportFragments = [
  'application-frame',
  'reasoning',
  'error',
  'mobile-api-progress',
  'attachment-preview',
  'message-bubbles',
  './07-pages/chat',
  './07-pages/playground',
  'dialog-system',
  './01-base/base',
  './02-foundation/typography',
  './studio/studio-workspace',
];

const restoredImports = removedImportFragments.filter((fragment) => indexScss.includes(fragment));
assert(
  restoredImports.length === 0,
  `Removed visual SCSS imports were reintroduced: ${restoredImports.join(', ')}`
);

console.log(
  `tailwind class integrity checks passed (${usedAliases.size} aliases, ${legacyImports.length} frozen legacy imports)`
);
