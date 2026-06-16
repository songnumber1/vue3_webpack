const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');

function exists(relativePath) {
  return fs.existsSync(path.join(root, relativePath));
}

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const indexScss = read('src/assets/styles/index.scss');
const promptDir = 'src/assets/styles/06-components/prompt';
const promptExpanded = read(`${promptDir}/_prompt-expanded.scss`);
const promptDesktop = read(`${promptDir}/_prompt-desktop.scss`);

assert(exists(`${promptDir}/_prompt-expanded.scss`), 'expanded prompt final guards must be grouped in _prompt-expanded.scss');
assert(exists(`${promptDir}/_prompt-desktop.scss`), 'desktop prompt final guards must be grouped in _prompt-desktop.scss');
assert(!exists(`${promptDir}/_prompt-expanded-mobile-height-fix.scss`), 'old expanded mobile height fix partial should stay merged into _prompt-expanded.scss');
assert(!exists(`${promptDir}/_prompt-expanded-text-top-gap-fix.scss`), 'old expanded text top-gap partial should stay merged into _prompt-expanded.scss');
assert(!exists(`${promptDir}/_desktop-prompt-border.scss`), 'old desktop prompt border partial should stay renamed to _prompt-desktop.scss');

assert(indexScss.includes('./06-components/prompt/prompt-desktop'), 'index.scss must import the renamed desktop prompt partial');
assert(indexScss.includes('./06-components/prompt/prompt-expanded'), 'index.scss must import the grouped expanded prompt partial');
assert(!indexScss.includes('desktop-prompt-border'), 'index.scss must not import the old desktop prompt partial name');
assert(!indexScss.includes('prompt-expanded-mobile-height-fix'), 'index.scss must not import the old expanded height partial name');
assert(!indexScss.includes('prompt-expanded-text-top-gap-fix'), 'index.scss must not import the old expanded text gap partial name');

const mobileGeometryIndex = promptExpanded.indexOf('--prompt-expanded-mobile-shell-top');
const textGapIndex = promptExpanded.indexOf('--prompt-expanded-textarea-top-padding');
assert(mobileGeometryIndex >= 0 && textGapIndex > mobileGeometryIndex, 'expanded prompt grouping must preserve mobile geometry before textarea top-gap guard');
assert(
  promptExpanded.includes('body.mobile-mode.prompt-input-expanded') &&
    promptExpanded.includes('body.actual-android-runtime.prompt-input-expanded') &&
    promptExpanded.includes('padding-top: var(--prompt-expanded-textarea-top-padding) !important;'),
  'expanded prompt grouping must keep mobile and Android expanded selectors intact'
);
assert(
  promptDesktop.includes('body.desktop-mode') && promptDesktop.includes('.chat-container-root--mode-main') && promptDesktop.includes('width: min(var(--layout-prompt-width, 880px), 100%)'),
  'renamed desktop prompt partial must keep desktop prompt selectors intact'
);

console.log('prompt SCSS structure static checks passed');
