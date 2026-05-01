function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
}

function renderInline(value) {
  return value
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
}

function renderBlock(block) {
  const lines = block.split('\n')
  const isList = lines.every((line) => /^\s*[-*]\s+/.test(line))
  const isOrderedList = lines.every((line) => /^\s*\d+\.\s+/.test(line))

  if (isList) {
    return `<ul>${lines.map((line) => `<li>${renderInline(line.replace(/^\s*[-*]\s+/, ''))}</li>`).join('')}</ul>`
  }
  if (isOrderedList) {
    return `<ol>${lines.map((line) => `<li>${renderInline(line.replace(/^\s*\d+\.\s+/, ''))}</li>`).join('')}</ol>`
  }
  if (/^#{1,3}\s+/.test(block)) {
    const depth = Math.min(block.match(/^#+/)[0].length, 3)
    return `<h${depth}>${renderInline(block.replace(/^#{1,3}\s+/, ''))}</h${depth}>`
  }
  return `<p>${renderInline(block).replace(/\n/g, '<br>')}</p>`
}

export function renderMarkdown(text) {
  const escaped = escapeHtml(text)
  const codeBlocks = []
  const withoutCode = escaped.replace(/```([\s\S]*?)```/g, (_, code) => {
    const token = `@@CODE_BLOCK_${codeBlocks.length}@@`
    codeBlocks.push(`<pre><code>${code.trim()}</code></pre>`)
    return token
  })

  const html = withoutCode
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => {
      const codeIndex = block.match(/^@@CODE_BLOCK_(\d+)@@$/)?.[1]
      if (codeIndex != null) return codeBlocks[Number(codeIndex)]
      return renderBlock(block)
    })
    .join('')

  return html || '<p></p>'
}
