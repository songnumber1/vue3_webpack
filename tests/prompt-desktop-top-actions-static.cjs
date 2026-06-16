const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const composerPath = path.join(
  root,
  "src/components/prompt/PromptComposer.vue"
);
const toolbarPath = path.join(
  root,
  "src/components/prompt/controls/PromptToolbarDesktop.vue"
);
const composerScssPath = path.join(
  root,
  "src/assets/styles/06-components/prompt/_prompt-composer.scss"
);
const runAllPath = path.join(root, "tests/run-all.cjs");

function read(file) {
  return fs.readFileSync(file, "utf8");
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const composer = read(composerPath);
const toolbar = read(toolbarPath);
const scss = read(composerScssPath);
const runAll = read(runAllPath);

assert(
  composer.includes("usesDesktopTopActions") &&
    composer.includes("!isMobileSheet.value"),
  "PromptComposer must enable top action layout only for desktop toolbar mode"
);
assert(
  composer.includes("prompt-box--desktop-top-actions") &&
    composer.includes(
      "'prompt-box--desktop-top-actions': usesDesktopTopActions"
    ),
  "PromptComposer must expose a desktop-only top-action prompt box class"
);
assert(
  composer.includes("prompt-desktop-top-row") &&
    composer.includes('layout-mode="top-actions"') &&
    composer.includes("prompt-expand-toggle--desktop-row"),
  "PromptComposer must render selector/tool/attach and expand toggle in the same desktop top row"
);
assert(
  composer.includes('layout-mode="submit-only"') &&
    composer.includes("prompt-toolbar-desktop-submit"),
  "PromptComposer must keep desktop submit actions separate from the top row"
);
assert(
  composer.includes("<component") &&
    composer.includes("v-else") &&
    composer.includes(':is="resolvedToolbarComponent"'),
  "PromptComposer must keep the existing mobile toolbar path unchanged"
);

assert(
  toolbar.includes("layoutMode") &&
    toolbar.includes("top-actions") &&
    toolbar.includes("submit-only"),
  "PromptToolbarDesktop must support top-actions and submit-only layout modes"
);
assert(
  toolbar.includes('v-if="!isSubmitOnly"') &&
    toolbar.includes('v-if="!isTopActionsOnly"'),
  "PromptToolbarDesktop must hide left actions in submit-only mode and hide submit actions in top-actions mode"
);
assert(
  toolbar.includes("prompt-action-row--top-actions") &&
    toolbar.includes("prompt-action-row--submit-only"),
  "PromptToolbarDesktop must expose layout mode classes for desktop rows"
);

assert(
  scss.includes(
    "body.desktop-mode .prompt-box--desktop-top-actions .prompt-desktop-top-row"
  ) &&
    scss.includes(".prompt-expand-toggle--desktop-row") &&
    scss.includes("position: static !important"),
  "Desktop top action row CSS must position expand/collapse in the row instead of absolute top-right"
);
assert(
  scss.includes(
    "body.desktop-mode .prompt-box--desktop-top-actions > .prompt-textarea"
  ) && scss.includes("padding-right: 0 !important"),
  "Desktop top action layout must remove textarea right padding that was only needed for the absolute expand button"
);
assert(
  !scss.includes(
    "body.mobile-mode .prompt-box--desktop-top-actions .prompt-desktop-top-row"
  ),
  "Desktop top action row CSS must not target mobile mode"
);
assert(
  runAll.includes('require("./prompt-desktop-top-actions-static.cjs")') ||
    runAll.includes("require('./prompt-desktop-top-actions-static.cjs')"),
  "run-all must include prompt desktop top actions static check"
);

console.log("prompt desktop top actions static checks passed");
