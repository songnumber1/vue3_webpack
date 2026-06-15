const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const file =
  "src/composables/chat/internal/message-list/useMessageListScroll.js";
const source = fs.readFileSync(path.join(root, file), "utf8");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

[
  "Runtime state guards and scroll element accessors",
  "OverlayScrollbar lifecycle and rendered-frame scheduling",
  "Latest user-message lookup and focus spacer integration",
  "Bottom state and message target controller",
  "History-render strategy and platform mode policy",
  "User scroll handling and previous-history lazy loading",
  "History lazy-load viewport anchor controller",
  "Scheduler cleanup and history render reset helpers",
  "Previous-history request flow",
  "Message identity and user-scroll intent helpers",
  "History render readiness checks",
  "Mermaid post-processing during history render",
  "Layout stability checks after render/post-process",
  "History render orchestration sequence",
  "Public scroll commands used by MessageList/ChatContainer",
  "Message rendered events and streaming scroll behavior",
  "Resize recalculation scheduling controller",
  "Watchers and DOM lifecycle",
  "Public return contract. Keep these names stable for callers.",
].forEach((marker) => {
  assert(source.includes(marker), `${file} must keep role marker: ${marker}`);
});

const publicReturnMarker =
  "Public return contract. Keep these names stable for callers.";
const publicReturnStart = source.indexOf(publicReturnMarker);
assert(publicReturnStart >= 0, `${file} must keep the public return marker`);
const publicReturnSource = source.slice(publicReturnStart);
const returnBlockMatch = publicReturnSource.match(
  /return \{([\s\S]*?)\n  \};\n\}/
);
assert(returnBlockMatch, `${file} must keep a plain public return object`);

const returnNames = Array.from(
  returnBlockMatch[1].matchAll(/\n\s*([A-Za-z0-9_]+),/g)
).map((match) => match[1]);
const expectedReturnNames = [
  "scrollRef",
  "bottomRef",
  "streamFocusSpacerHeight",
  "androidManualHistoryLoadMode",
  "previousHistoryLoadInProgress",
  "handleScroll",
  "handleUserScrollIntent",
  "handleManualPreviousHistoryLoad",
  "handleMessageRendered",
  "scrollToBottom",
  "scrollToBottomAfterRender",
  "scrollToInitialTarget",
  "scrollToLatestUserMessage",
  "getIsAtBottom",
  "getScrollElement",
];

assert(
  JSON.stringify(returnNames) === JSON.stringify(expectedReturnNames),
  `${file} public return names changed:\nexpected ${expectedReturnNames.join(", ")}\nactual   ${returnNames.join(", ")}`
);

const utilsFile =
  "src/composables/chat/internal/message-list/messageListScrollUtils.js";
const utilsSource = fs.readFileSync(path.join(root, utilsFile), "utf8");
[
  "export function isAndroidHistoryRenderRuntime",
  "export function shouldUseManualHistoryLoadMode",
  "export function getScrollableAncestors",
  "export function scrollElementToTarget",
  "export function applyWindowFallbackScroll",
  "export function countMermaidBlocksInText",
  "export function isAssistantErrorMessage",
].forEach((marker) => {
  assert(
    utilsSource.includes(marker),
    `${utilsFile} must keep helper export: ${marker}`
  );
});

[
  "function isForcedAndroidPlatformOverride",
  "function isCompactHistoryViewport",
  "function canElementScroll",
  "function countMermaidBlocksInText",
  "function isAssistantErrorMessage",
].forEach((marker) => {
  assert(
    !source.includes(marker),
    `${file} should keep step 2 pure helper outside orchestrator: ${marker}`
  );
});

const lazyPrependFile =
  "src/composables/chat/internal/message-list/useMessageLazyPrependScroll.js";
const lazyPrependSource = fs.readFileSync(
  path.join(root, lazyPrependFile),
  "utf8"
);
[
  "export function createMessageLazyPrependScrollController",
  "function getHistoryLazyViewportAnchor",
  "function restoreHistoryLazyViewportAnchor",
  "function restoreHistoryLazyViewportAnchorByViewport",
  "function startManualHistoryAnchorLock",
  "function cancelManualHistoryAnchorLock",
].forEach((marker) => {
  assert(
    lazyPrependSource.includes(marker),
    `${lazyPrependFile} must keep lazy prepend controller member: ${marker}`
  );
});

[
  "function findMessageElementById",
  "function getElementOffsetTopWithinScroll",
  "function startManualHistoryAnchorLock",
].forEach((marker) => {
  assert(
    !source.includes(marker),
    `${file} should keep step 3 lazy prepend controller outside orchestrator: ${marker}`
  );
});

const overlaySyncFile =
  "src/composables/chat/internal/message-list/useMessageOverlayScrollSync.js";
const overlaySyncSource = fs.readFileSync(
  path.join(root, overlaySyncFile),
  "utf8"
);
[
  "export function createMessageOverlayScrollSyncController",
  "function setupOverlayScrollbar",
  "function updateOverlayScrollbarFrame",
  "function scheduleTrackedAnimationFrame",
  "function clearTrackedAnimationFrames",
  "function clearRenderedFrameScheduler",
  "function scheduleRenderedFrameUpdate",
  "function cleanupOverlayScrollbar",
].forEach((marker) => {
  assert(
    overlaySyncSource.includes(marker),
    `${overlaySyncFile} must keep overlay sync controller member: ${marker}`
  );
});

[
  "function setupOverlayScrollbar",
  "function updateOverlayScrollbarFrame",
  "function scheduleTrackedAnimationFrame",
  "function clearTrackedAnimationFrames",
  "function clearRenderedFrameScheduler",
  "function cleanupOverlayScrollbar",
  "let overlayScrollViewport",
  "let overlayScrollSource",
  "let trackedRafIds",
  "let renderedFrameRafId",
].forEach((marker) => {
  assert(
    !source.includes(marker),
    `${file} should keep step 4 overlay sync controller outside orchestrator: ${marker}`
  );
});

const targetScrollFile =
  "src/composables/chat/internal/message-list/useMessageTargetScroll.js";
const targetScrollSource = fs.readFileSync(
  path.join(root, targetScrollFile),
  "utf8"
);
[
  "export function createLatestUserMessageElementFinder",
  "export function createMessageTargetScrollController",
  "function getLatestUserMessageKey",
  "function getLatestUserMessageElement",
  "function resetLatestUserMessageCache",
  "function applyElementScroll",
  "function scrollToLatestUserMessage",
  "function scrollToInitialTarget",
].forEach((marker) => {
  assert(
    targetScrollSource.includes(marker),
    `${targetScrollFile} must keep target scroll controller member: ${marker}`
  );
});

[
  "function getLatestUserMessageKey",
  "function getLatestUserMessageElement",
  "function applyElementScroll",
].forEach((marker) => {
  assert(
    !source.includes(marker),
    `${file} should keep step 5 target scroll controller outside orchestrator: ${marker}`
  );
});

const bottomScrollFile =
  "src/composables/chat/internal/message-list/useMessageBottomScroll.js";
const bottomScrollSource = fs.readFileSync(
  path.join(root, bottomScrollFile),
  "utf8"
);
[
  "export function createMessageBottomScrollController",
  "function applyBottomScroll",
  "function applyHistoryRenderInitialScrollTarget",
  "function applyHistoryRenderBottomScroll",
  "function scrollToBottomAfterRender",
  "function scrollToBottom",
  "function handlePendingAfterRenderMessageRendered",
  "function getIsAtBottom",
].forEach((marker) => {
  assert(
    bottomScrollSource.includes(marker),
    `${bottomScrollFile} must keep bottom scroll controller member: ${marker}`
  );
});

[
  "function shouldAutoHistoryRenderBottomScroll",
  "function applyBottomScrollAfterRender",
  "function scrollToBottomAfterRender",
  "function scrollToBottom(options",
  "let pendingAfterRenderAssistantIds",
  "let pendingAfterRenderOptions",
  "let afterRenderScrollRafId",
].forEach((marker) => {
  assert(
    !source.includes(marker),
    `${file} should keep step 6 bottom scroll controller outside orchestrator: ${marker}`
  );
});

const userScrollIntentFile =
  "src/composables/chat/internal/message-list/useMessageUserScrollIntent.js";
const userScrollIntentSource = fs.readFileSync(
  path.join(root, userScrollIntentFile),
  "utf8"
);
[
  "export function createMessageUserScrollIntentController",
  "function handleUserScrollIntent",
  "function addUserScrollIntentListeners",
  "function removeUserScrollIntentListeners",
].forEach((marker) => {
  assert(
    userScrollIntentSource.includes(marker),
    `${userScrollIntentFile} must keep user scroll intent controller member: ${marker}`
  );
});

[
  'window.addEventListener("touchstart", handleUserScrollIntent',
  'window.addEventListener("wheel", handleUserScrollIntent',
  'window.addEventListener("keydown", handleUserScrollIntent',
  'window.removeEventListener("touchstart", handleUserScrollIntent',
  'window.removeEventListener("wheel", handleUserScrollIntent',
  'window.removeEventListener("keydown", handleUserScrollIntent',
].forEach((marker) => {
  assert(
    !source.includes(marker),
    `${file} should keep user scroll intent listener wiring in controller: ${marker}`
  );
});

assert(
  source.includes("addUserScrollIntentListeners(window)"),
  `${file} must delegate user scroll listener setup to useMessageUserScrollIntent`
);
assert(
  source.includes("removeUserScrollIntentListeners(window)"),
  `${file} must delegate user scroll listener cleanup to useMessageUserScrollIntent`
);

const resizeRecalculateFile =
  "src/composables/chat/internal/message-list/useMessageResizeRecalculate.js";
const resizeRecalculateSource = fs.readFileSync(
  path.join(root, resizeRecalculateFile),
  "utf8"
);
[
  "export function createMessageResizeRecalculateController",
  "function runResizeRecalculateFrame",
  "function clearResizeRecalculateScheduler",
  "function scheduleResizeRecalculate",
].forEach((marker) => {
  assert(
    resizeRecalculateSource.includes(marker),
    `${resizeRecalculateFile} must keep resize recalculation controller member: ${marker}`
  );
});

[
  "function clearResizeRecalculateScheduler",
  "function scheduleResizeRecalculate",
  "let resizeRecalculateTimerId",
  "let resizeRecalculateRafId",
].forEach((marker) => {
  assert(
    !source.includes(marker),
    `${file} should keep step 8 resize recalculation controller outside orchestrator: ${marker}`
  );
});

assert(
  source.includes("createMessageResizeRecalculateController"),
  `${file} must wire resize recalculation through useMessageResizeRecalculate`
);

console.log("chat message-list scroll static checks passed");
