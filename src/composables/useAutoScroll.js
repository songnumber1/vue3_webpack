import { nextTick } from 'vue'

function afterFrame(callback) {
  if (typeof window === 'undefined' || typeof window.requestAnimationFrame !== 'function') {
    window.setTimeout(callback, 0)
    return
  }

  window.requestAnimationFrame(() => {
    window.requestAnimationFrame(callback)
  })
}

/**
 * Scroll helper for chat screens.
 * It waits for Vue DOM updates and two browser paint frames so Android keyboard
 * viewport changes are reflected before the scroll position is calculated.
 */
export function useAutoScroll(targetRef) {
  async function scrollToBottom(options = {}) {
    await nextTick()
    afterFrame(() => {
      const target = targetRef.value
      if (!target) return

      if (typeof target.scrollToBottom === 'function') {
        target.scrollToBottom(options)
        return
      }

      target.scrollTop = target.scrollHeight
    })
  }

  return { scrollToBottom }
}
