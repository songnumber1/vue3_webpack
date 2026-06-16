const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const read = (relativePath) =>
  fs.readFileSync(path.join(root, relativePath), 'utf8');

function assertIncludes(source, expected, message) {
  if (!source.includes(expected)) {
    throw new Error(message || `Expected source to include: ${expected}`);
  }
}

const helper = read('src/platform/runtime/runtimeModeHelpers.js');
const overlayPolicy = read('src/platform/scroll/scrollRuntimePolicy.js');
const runtimeFlags = read('src/composables/app/useRuntimeModeFlags.js');

assertIncludes(
  helper,
  'export function isActualAndroidRuntimeInfo',
  '실제 Android 런타임 helper가 있어야 합니다.'
);
assertIncludes(
  helper,
  'export function isActualAndroidChromeRuntimeInfo',
  '실제 Android Chrome 런타임 helper가 있어야 합니다.'
);
assertIncludes(
  helper,
  'export function isActualAndroidWebViewRuntimeInfo',
  '실제 Android WebView 런타임 helper가 있어야 합니다.'
);
assertIncludes(
  helper,
  'export function resolveActualRuntimeMode',
  'actual runtime mode resolver가 있어야 합니다.'
);
assertIncludes(
  overlayPolicy,
  '@/platform/runtime/runtimeModeHelpers',
  'OverlayScroll policy는 중복 Android 판별 대신 runtime helper를 사용해야 합니다.'
);
assertIncludes(
  overlayPolicy,
  'isActualAndroidRuntimeInfo as isActualAndroidOverlayRuntime',
  '기존 public export 명칭은 유지하면서 runtime helper로 위임해야 합니다.'
);
assertIncludes(
  runtimeFlags,
  'isActualAndroidRuntimeInfo',
  'runtime mode flags는 실제 Android 판별 helper를 사용해야 합니다.'
);
assertIncludes(
  runtimeFlags,
  'isActualAndroidRuntime,',
  'runtime mode flags는 actual Android runtime 플래그를 반환해야 합니다.'
);
assertIncludes(
  runtimeFlags,
  'isActualAndroidWebViewRuntime,',
  'runtime mode flags는 actual Android WebView runtime 플래그를 반환해야 합니다.'
);

console.log('runtime mode helper static checks passed');
