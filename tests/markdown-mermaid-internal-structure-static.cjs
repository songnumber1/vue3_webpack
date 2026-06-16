const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const markdownPath = path.join(root, 'src/utils/markdown.js');
const mermaidPath = path.join(root, 'src/utils/mermaidRenderer.js');
const markdown = fs.readFileSync(markdownPath, 'utf8');
const mermaid = fs.readFileSync(mermaidPath, 'utf8');

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function assertOrderedSections(source, sections, fileName) {
  let previousIndex = -1;
  sections.forEach((section) => {
    const index = source.indexOf(section);
    assert(index >= 0, `${fileName} is missing section marker: ${section}`);
    assert(index > previousIndex, `${fileName} section order is invalid near: ${section}`);
    previousIndex = index;
  });
}

assertOrderedSections(
  markdown,
  [
    'Sanitizer schema',
    'Text and localization helpers',
    'Toolbar AST node factories',
    'Rehype transforms',
    'Processor factory',
    'Processor instances',
    'Public API',
  ],
  'markdown.js'
);

assertOrderedSections(
  mermaid,
  [
    'Render constants',
    'Runtime and frame helpers',
    'Mermaid configuration',
    'Mermaid target state and source helpers',
    'Mermaid validation helpers',
    'SVG normalization helpers',
    'Single target render flow',
    'Batch render flow',
    'Public API',
  ],
  'mermaidRenderer.js'
);

assert(
  markdown.includes('export async function renderMarkdown'),
  'markdown.js should keep renderMarkdown as its public API.'
);

assert(
  mermaid.includes('export function fallbackPendingMermaidToCode') &&
    mermaid.includes('export function warmupMermaidForHistoryRender') &&
    mermaid.includes('export function renderMermaidInElement'),
  'mermaidRenderer.js should keep the existing public API exports.'
);

assert(
  !markdown.includes('이 모듈 내부의 세부 처리 단계입니다') &&
    !markdown.includes('호출 흐름에서 재사용할 객체'),
  'markdown.js should not keep generic boilerplate section comments.'
);

console.log('markdown/mermaid internal structure static checks passed');
