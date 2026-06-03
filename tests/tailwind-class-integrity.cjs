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

const tailwindConfig = read('tailwind.config.js');
const tailwindIndex = read('src/assets/styles/tailwind/index.scss');
const indexScss = read('src/assets/styles/index.scss');
const progressOverlay = read('src/components/overlay/ProgressOverlay.vue');

assert(tailwindConfig.includes("prefix: 'tw-'"), 'Tailwind utility prefix must remain tw-');
assert(tailwindConfig.includes('preflight: false'), 'Tailwind preflight must remain disabled');
assert(tailwindConfig.includes("strategy: 'class'"), '@tailwindcss/forms must remain class-scoped');

const removedLayerNames = ['_base.scss', '_components.scss', '_utilities.scss'];
const activeTailwindFiles = tailwindFiles.map((file) => path.basename(file));
const restoredLayers = removedLayerNames.filter((name) => activeTailwindFiles.includes(name));
assert(restoredLayers.length === 0, `Removed Tailwind layer files restored unexpectedly: ${restoredLayers.join(', ')}`);

assert(
  tailwindIndex.includes('@tailwind utilities') && tailwindIndex.includes('@import "./tokens"'),
  'Tailwind entry must keep utilities and token bridge active'
);

const sourceText = sourceFiles.map((file) => fs.readFileSync(file, 'utf8')).join('\n');
assert(
  progressOverlay.includes('tw-animate-spin') && !indexScss.includes('./06-components/mobile/mobile-api-progress'),
  'ProgressOverlay should be fully covered by tw-* utilities after mobile-api-progress SCSS removal'
);

const usedTwClasses = new Set([...sourceText.matchAll(/\btw-[A-Za-z0-9_:\/\[\].()%#,-]+/g)].map((match) => match[0]));
assert(usedTwClasses.size > 0, 'Step 3/4 migration should have prefixed tw- classes in Vue/JS source');

const riskyUnprefixedUtilityFragments = [
  ' class="flex ',
  ' class="grid ',
  ' class="fixed ',
  ' class="absolute ',
  ' class="relative ',
  ' class="border ',
  ' class="hidden ',
];
const riskyHits = [];
for (const file of sourceFiles) {
  const content = fs.readFileSync(file, 'utf8');
  for (const fragment of riskyUnprefixedUtilityFragments) {
    if (content.includes(fragment)) riskyHits.push(`${path.relative(root, file)}:${fragment.trim()}`);
  }
}
assert(
  riskyHits.length === 0,
  `Potential unprefixed Tailwind utility classes found: ${riskyHits.join(', ')}`
);

const requiredLegacyRuntimeImports = [
  './06-components/bottom-sheet/bottom-sheet',
  './06-components/prompt/prompt-mobile-runtime',
  './06-components/dialog/dialog-control',
  './06-components/dialog/dialog-viewport',
  './03-runtime/viewport-keyboard',
  './03-runtime/safe-area',
  './studio/studio-workspace',
];
const missingRuntimeImports = requiredLegacyRuntimeImports.filter((item) => !indexScss.includes(item));
assert(
  missingRuntimeImports.length === 0,
  `Required runtime/Studio SCSS imports are missing: ${missingRuntimeImports.join(', ')}`
);

console.log(
  `Step 4-4 Tailwind integrity checks passed (${usedTwClasses.size} prefixed classes, ${tailwindFiles.length} active Tailwind SCSS files)`
);
