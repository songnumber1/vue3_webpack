import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import remarkRehype from 'remark-rehype'
import rehypeKatex from 'rehype-katex'
import rehypeStringify from 'rehype-stringify'
import rehypeExternalLinks from 'rehype-external-links'
import rehypeHighlight from 'rehype-highlight'
import { visit } from 'unist-util-visit'

function textContent(node) {
  if (!node) return ''
  if (typeof node.value === 'string') return node.value
  if (!Array.isArray(node.children)) return ''
  return node.children.map(textContent).join('')
}

function rehypeTableWrapper() {
  return (tree) => {
    visit(tree, 'element', (node, index, parent) => {
      if (!parent || typeof index !== 'number') return
      if (node.tagName !== 'table') return

      parent.children[index] = {
        type: 'element',
        tagName: 'div',
        properties: { className: ['md-table-wrapper'] },
        children: [node]
      }
    })
  }
}

function rehypeMermaidBlock() {
  return (tree) => {
    visit(tree, 'element', (node, index, parent) => {
      if (!parent || typeof index !== 'number') return
      if (node.tagName !== 'pre') return

      const codeNode = node.children?.[0]
      const classNames = codeNode?.properties?.className || []
      const isMermaid = codeNode?.tagName === 'code' && classNames.includes('language-mermaid')
      if (!isMermaid) return

      parent.children[index] = {
        type: 'element',
        tagName: 'div',
        properties: {
          className: ['mermaid', 'md-mermaid'],
          'data-mermaid-pending': 'true'
        },
        children: [{ type: 'text', value: textContent(codeNode) }]
      }
    })
  }
}

const processor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkMath)
  .use(remarkRehype)
  .use(rehypeKatex, { throwOnError: false, strict: false })
  .use(rehypeHighlight, { ignoreMissing: true, detect: false })
  .use(rehypeTableWrapper)
  .use(rehypeMermaidBlock)
  .use(rehypeExternalLinks, {
    target: '_blank',
    rel: ['nofollow', 'noopener', 'noreferrer']
  })
  .use(rehypeStringify)

export async function renderMarkdown(text) {
  const file = await processor.process(String(text ?? ''))
  const html = String(file).trim()
  return html || '<p></p>'
}

export function isMarkdownRenderable(value) {
  return value !== undefined && value !== null
}
