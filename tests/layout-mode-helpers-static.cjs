const fs = require('fs');
const path = require('path');

const root = process.cwd();
const helperPath = path.join(root, 'src/platform/layout/layoutModeHelpers.js');
const runtimeFlagsPath = path.join(root, 'src/composables/app/useRuntimeModeFlags.js');

function read(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function assertIncludes(source, needle, label) {
  if (!source.includes(needle)) {
    throw new Error(`${label}: missing ${needle}`);
  }
}

if (!fs.existsSync(helperPath)) {
  throw new Error('layoutModeHelpers.js must exist');
}

const helper = read(helperPath);
assertIncludes(helper, 'LAYOUT_MODE', 'layout helper must expose layout mode constants');
assertIncludes(helper, 'hasBodyMobileLayoutMode', 'layout helper must expose body mobile mode helper');
assertIncludes(helper, 'resolveCompactViewportFlag', 'layout helper must expose compact flag resolver');
assertIncludes(helper, 'shouldUseMobileLayoutForFlags', 'layout helper must expose mobile layout resolver');
assertIncludes(helper, 'resolveLayoutMode', 'layout helper must expose layout mode resolver');
assertIncludes(helper, 'Android/PC 같은 실제 실행 환경을 판단하지 않습니다', 'layout helper must document runtime/layout separation');

const runtimeFlags = read(runtimeFlagsPath);
assertIncludes(runtimeFlags, '@/platform/layout/layoutModeHelpers', 'useRuntimeModeFlags must import layout helpers');
assertIncludes(runtimeFlags, 'resolveCompactViewportFlag', 'isCompactViewport must use layout helper');
assertIncludes(runtimeFlags, 'shouldUseMobileLayoutForFlags', 'shouldUseMobileLayout must use layout helper');
assertIncludes(runtimeFlags, 'layoutMode', 'useRuntimeModeFlags must expose layoutMode');
assertIncludes(runtimeFlags, 'isMobileLayout', 'useRuntimeModeFlags must expose isMobileLayout');
assertIncludes(runtimeFlags, 'isDesktopLayout', 'useRuntimeModeFlags must expose isDesktopLayout');

console.log('layout mode helper static checks passed');
