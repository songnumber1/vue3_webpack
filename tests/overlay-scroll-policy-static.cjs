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

function assertNotIncludes(source, unexpected, message) {
  if (source.includes(unexpected)) {
    throw new Error(message || `Expected source not to include: ${unexpected}`);
  }
}

const policy = read('src/platform/scroll/scrollRuntimePolicy.js');
const compatPolicy = read('src/utils/overlayScrollPolicy.js');
const composable = read('src/composables/ui/useOverlayScrollPolicy.js');
const util = read('src/platform/scroll/overlayScrollbarController.js');
const utilCompat = read('src/utils/overlayScrollbar.js');
const appContainer = read('src/containers/AppContainer.vue');

assertIncludes(
  policy,
  'export const DEFAULT_OVERLAY_SCROLL_MODE = OVERLAY_SCROLL_MODE.ALL;',
  'OverlayScrollbars 기본 정책은 PC/Android 모두 사용하는 ALL이어야 합니다.'
);
assertIncludes(
  policy,
  'mode = DEFAULT_OVERLAY_SCROLL_MODE',
  'shouldUseOverlayScrollbarForRuntime 기본 mode는 DEFAULT_OVERLAY_SCROLL_MODE를 사용해야 합니다.'
);
assertIncludes(
  policy,
  ': DEFAULT_OVERLAY_SCROLL_MODE;',
  '알 수 없는 overlay mode fallback도 현재 기준선인 DEFAULT_OVERLAY_SCROLL_MODE를 사용해야 합니다.'
);
assertIncludes(
  compatPolicy,
  'export * from "@/platform/scroll/scrollRuntimePolicy";',
  '기존 utils/overlayScrollPolicy 경로는 platform scroll 정책을 re-export해야 합니다.'
);
assertIncludes(
  composable,
  'from "@/platform/scroll/scrollRuntimePolicy";',
  'useOverlayScrollPolicy는 canonical platform scroll 정책을 직접 사용해야 합니다.'
);
assertNotIncludes(
  composable,
  '@/utils/overlayScrollPolicy',
  'useOverlayScrollPolicy는 compat utils 정책 경로를 직접 사용하지 않아야 합니다.'
);
assertIncludes(
  composable,
  'const overlayScrollMode = computed(() => DEFAULT_OVERLAY_SCROLL_MODE);',
  'useOverlayScrollPolicy는 하드코딩 문자열 대신 DEFAULT_OVERLAY_SCROLL_MODE를 사용해야 합니다.'
);
assertIncludes(
  util,
  'from "@/platform/scroll/scrollRuntimePolicy";',
  'overlayScrollbar canonical controller fallback은 canonical platform scroll 정책을 직접 사용해야 합니다.'
);
assertNotIncludes(
  util,
  '@/utils/overlayScrollPolicy',
  'overlayScrollbar canonical controller는 compat utils 정책 경로를 직접 사용하지 않아야 합니다.'
);
assertIncludes(
  utilCompat,
  'export * from "@/platform/scroll/overlayScrollbarController";',
  '기존 utils/overlayScrollbar 경로는 platform scroll controller를 re-export해야 합니다.'
);
assertIncludes(
  appContainer,
  'overlay-scroll-runtime',
  'AppContainer는 scroll runtime class를 동기화해야 합니다.'
);
assertIncludes(
  appContainer,
  'actualRuntimeScroll',
  'AppContainer는 실제 scroll runtime dataset을 동기화해야 합니다.'
);

console.log('overlay scroll policy static checks passed');
