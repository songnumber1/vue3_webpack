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

const controller = read('src/platform/scroll/overlayScrollbarController.js');
const compat = read('src/utils/overlayScrollbar.js');
const useOverlayScrollbar = read('src/composables/ui/useOverlayScrollbar.js');
const messageOverlay = read('src/composables/chat/internal/message-list/useMessageOverlayScrollSync.js');
const assistantMessage = read('src/components/chat/AssistantMessage.vue');
const mermaidRenderer = read('src/utils/mermaidRenderer.js');

assertIncludes(
  controller,
  'export function initOverlayScrollbar',
  'canonical overlay scrollbar controller must expose initOverlayScrollbar.'
);
assertIncludes(
  controller,
  'export function destroyOverlayScrollbar',
  'canonical overlay scrollbar controller must expose destroyOverlayScrollbar.'
);
assertIncludes(
  controller,
  'export function updateOverlayScrollbar',
  'canonical overlay scrollbar controller must expose updateOverlayScrollbar.'
);
assertIncludes(
  controller,
  'export function getOverlayScrollbarViewport',
  'canonical overlay scrollbar controller must expose getOverlayScrollbarViewport.'
);
assertIncludes(
  controller,
  'export function enhanceMarkdownScrollbars',
  'canonical overlay scrollbar controller must expose enhanceMarkdownScrollbars.'
);
assertIncludes(
  controller,
  '@/platform/scroll/scrollRuntimePolicy',
  'overlay scrollbar controller must use canonical scroll runtime policy.'
);
assertIncludes(
  compat,
  'export * from "@/platform/scroll/overlayScrollbarController";',
  'legacy utils/overlayScrollbar path must remain a compatibility re-export.'
);
assertIncludes(
  useOverlayScrollbar,
  '@/platform/scroll/overlayScrollbarController',
  'useOverlayScrollbar must import the canonical overlay scrollbar controller.'
);
assertNotIncludes(
  useOverlayScrollbar,
  '@/utils/overlayScrollbar',
  'useOverlayScrollbar must not use the legacy overlayScrollbar compat path.'
);
assertIncludes(
  messageOverlay,
  '@/platform/scroll/overlayScrollbarController',
  'message overlay sync must import the canonical overlay scrollbar controller.'
);
assertNotIncludes(
  messageOverlay,
  '@/utils/overlayScrollbar',
  'message overlay sync must not use the legacy overlayScrollbar compat path.'
);
assertIncludes(
  assistantMessage,
  '@/platform/scroll/overlayScrollbarController',
  'AssistantMessage markdown enhancement must import the canonical overlay scrollbar controller.'
);
assertIncludes(
  mermaidRenderer,
  '@/platform/scroll/overlayScrollbarController',
  'Mermaid renderer must import the canonical overlay scrollbar controller.'
);

console.log('overlay scrollbar controller static checks passed');
