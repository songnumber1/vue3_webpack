const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const orchestratorPath =
  "src/composables/chat/internal/message-list/useMessageListScroll.js";
const constantsPath =
  "src/composables/chat/internal/message-list/messageListScrollConstants.js";
const readinessPath =
  "src/composables/chat/internal/message-list/useMessageHistoryRenderReadiness.js";
const postProcessPath =
  "src/composables/chat/internal/message-list/useMessageHistoryPostProcess.js";
const lifecyclePath =
  "src/composables/chat/internal/message-list/useMessageHistoryRenderLifecycle.js";
const previousHistoryPath =
  "src/composables/chat/internal/message-list/usePreviousHistoryLazyLoad.js";

const publicContractPath =
  "src/composables/chat/internal/message-list/useMessageListScrollPublicContract.js";

const orchestrator = fs.readFileSync(path.join(root, orchestratorPath), "utf8");
const constants = fs.readFileSync(path.join(root, constantsPath), "utf8");
const readiness = fs.readFileSync(path.join(root, readinessPath), "utf8");
const postProcess = fs.readFileSync(path.join(root, postProcessPath), "utf8");
const lifecycle = fs.readFileSync(path.join(root, lifecyclePath), "utf8");
const previousHistory = fs.readFileSync(path.join(root, previousHistoryPath), "utf8");
const publicContract = fs.readFileSync(path.join(root, publicContractPath), "utf8");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

[
  "export const BOTTOM_THRESHOLD",
  "export const DEFAULT_HISTORY_LAZY_TOP_THRESHOLD",
  "export const STABLE_SCROLL_DELAYS",
  "export const HISTORY_RENDER_READY_STABLE_FRAMES",
  "export const HISTORY_RENDER_MERMAID_BATCH_SIZE",
  "export const RESIZE_RECALCULATE_DEBOUNCE_MS",
  "export const KEYBOARD_SUBMIT_STABLE_SCROLL_DELAYS",
].forEach((marker) => {
  assert(constants.includes(marker), `${constantsPath} must expose ${marker}`);
  const constantName = marker.replace("export const ", "");
  const consumerSource =
    constantName === "HISTORY_RENDER_MERMAID_BATCH_SIZE"
      ? postProcess
      : `${orchestrator}
${postProcess}
${lifecycle}
${previousHistory}`;
  assert(
    consumerSource.includes(constantName),
    `${orchestratorPath} or ${postProcessPath} must consume ${marker}`
  );
});

[
  "export function createMessageHistoryRenderReadinessController",
  "function createHistoryRenderDomIndex",
  "function isHistoryRenderDomReady",
  "function isHistoryRenderPostProcessReady",
  "function getPendingHistoryRenderMermaidTargets",
].forEach((marker) => {
  assert(readiness.includes(marker), `${readinessPath} must keep ${marker}`);
});

[
  "function createHistoryRenderDomIndex",
  "function isHistoryRenderDomReady",
  "function isHistoryRenderPostProcessReady",
  "function getExpectedHistoryRenderMermaidCount",
].forEach((marker) => {
  assert(
    !orchestrator.includes(marker),
    `${orchestratorPath} should delegate readiness helper: ${marker}`
  );
});

[
  "export function createMessageHistoryPostProcessController",
  "function renderHistoryRoomPendingMermaidSequentially",
  "function waitForHistoryRenderLayoutStability",
  "function finalizeHistoryRenderPostProcess",
  "HISTORY_RENDER_MERMAID_BATCH_SIZE",
  "HISTORY_RENDER_LAYOUT_STABLE_FRAMES",
].forEach((marker) => {
  assert(
    postProcess.includes(marker),
    `${postProcessPath} must keep ${marker}`
  );
});

[
  "export function createMessageHistoryRenderLifecycleController",
  "function waitForHistoryRenderDomReady",
  "function revealProgressiveHistoryMarkdownIfReady",
  "function runHistoryRenderThenScrollSequence",
  "HISTORY_RENDER_READY_STABLE_FRAMES",
].forEach((marker) => {
  assert(
    lifecycle.includes(marker),
    `${lifecyclePath} must keep ${marker}`
  );
});

[
  "function waitForHistoryRenderDomReady",
  "function revealProgressiveHistoryMarkdownIfReady",
  "async function runHistoryRenderThenScrollSequence",
].forEach((marker) => {
  assert(
    !orchestrator.includes(marker),
    `${orchestratorPath} should delegate lifecycle helper: ${marker}`
  );
});

assert(
  orchestrator.includes("createMessageHistoryRenderLifecycleController"),
  `${orchestratorPath} must wire lifecycle controller`
);

[
  "export function createPreviousHistoryLazyLoadController",
  "async function requestPreviousHistoryMessagesIfNeeded",
  "function handleManualPreviousHistoryLoad",
  "function blurHistoryLoadMoreTrigger",
  "DEFAULT_HISTORY_LAZY_TOP_THRESHOLD",
].forEach((marker) => {
  assert(
    previousHistory.includes(marker),
    `${previousHistoryPath} must keep previous-history lazy-load member: ${marker}`
  );
});

[
  "async function requestPreviousHistoryMessagesIfNeeded",
  "function blurHistoryLoadMoreTrigger",
  "function handleManualPreviousHistoryLoad",
].forEach((marker) => {
  assert(
    !orchestrator.includes(marker),
    `${orchestratorPath} should delegate previous-history lazy-load helper: ${marker}`
  );
});

assert(
  orchestrator.includes("createPreviousHistoryLazyLoadController"),
  `${orchestratorPath} must wire previous-history lazy-load controller`
);

[
  "fallbackPendingMermaidToCode",
  "renderMermaidInElement",
  "function getHistoryRenderLayoutMetrics",
  "function hasPendingHistoryRenderMermaid",
].forEach((marker) => {
  assert(
    !orchestrator.includes(marker),
    `${orchestratorPath} should delegate post-process helper: ${marker}`
  );
});

assert(
  orchestrator.includes("createMessageHistoryRenderReadinessController"),
  `${orchestratorPath} must wire readiness controller`
);
[
  "export const MESSAGE_LIST_SCROLL_PUBLIC_CONTRACT_KEYS",
  "export function createMessageListScrollPublicContract",
  "scrollToLatestUserMessage: contract.scrollToLatestUserMessage",
  "getScrollElement: contract.getScrollElement",
].forEach((marker) => {
  assert(
    publicContract.includes(marker),
    `${publicContractPath} must keep public contract member: ${marker}`
  );
});

assert(
  orchestrator.includes("createMessageListScrollPublicContract"),
  `${orchestratorPath} must return through public contract helper`
);

assert(
  orchestrator.includes("createMessageHistoryPostProcessController"),
  `${orchestratorPath} must wire post-process controller`
);

console.log("message-list depth static checks passed");
