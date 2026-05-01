import { nextTick } from 'vue'

export function useAutoScroll(containerRef) {
  async function scrollToBottom() {
    await nextTick()
    const el = containerRef.value
    if (!el) return
    el.scrollTop = el.scrollHeight
  }
  return { scrollToBottom }
}
