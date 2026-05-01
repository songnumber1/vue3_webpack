let mermaidLoader = null

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`)
    if (existing) {
      existing.addEventListener('load', resolve, { once: true })
      existing.addEventListener('error', reject, { once: true })
      if (window.mermaid) resolve()
      return
    }

    const script = document.createElement('script')
    script.src = src
    script.async = true
    script.onload = resolve
    script.onerror = reject
    document.head.appendChild(script)
  })
}

async function ensureMermaid() {
  if (window.mermaid) return window.mermaid

  if (!mermaidLoader) {
    mermaidLoader = loadScript('https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js')
      .then(() => window.mermaid)
      .then((mermaid) => {
        mermaid?.initialize?.({ startOnLoad: false, securityLevel: 'strict', theme: 'default' })
        return mermaid
      })
      .catch((error) => {
        console.warn('Mermaid could not be loaded. The source code block will remain visible.', error)
        return null
      })
  }

  return mermaidLoader
}

export async function renderMermaidInElement(root) {
  if (!root) return

  const targets = Array.from(root.querySelectorAll('.md-mermaid[data-mermaid-pending="true"]'))
  if (targets.length === 0) return

  const mermaid = await ensureMermaid()
  if (!mermaid?.run) return

  targets.forEach((target) => {
    target.removeAttribute('data-mermaid-pending')
  })

  try {
    await mermaid.run({ nodes: targets })
  } catch (error) {
    console.warn('Mermaid rendering failed.', error)
    targets.forEach((target) => {
      target.setAttribute('data-mermaid-error', 'true')
    })
  }
}
