export async function loadMarkdownShowcase() {
  try {
    const response = await fetch('/samples/markdown-showcase.md', { cache: 'no-store' })
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    return await response.text()
  } catch (error) {
    console.warn('Failed to load markdown showcase file.', error)
    return '# Markdown 샘플 로드 실패\n\n`public/samples/markdown-showcase.md` 파일을 확인해주세요.'
  }
}
