import { nextTick } from 'vue'

function afterFrame(callback) {
  if (typeof window === 'undefined' || typeof window.requestAnimationFrame !== 'function') {
    setTimeout(callback, 0)
    return
  }

  window.requestAnimationFrame(() => {
    window.requestAnimationFrame(callback)
  })
}

/**
 * Scroll helper for chat screens.
 *
 * The helper intentionally delegates the actual scroll decision to MessageList.
 * MessageList knows whether the user is already near the bottom and can prevent
 * desktop resize/layout changes from stealing the user's current scroll position.
 */
export function useAutoScroll(targetRef) {
  async function scrollToBottom(options = {}) {
    await nextTick()

    afterFrame(() => {
      const target = targetRef.value
      if (!target) return

      if (typeof target.scrollToBottom === 'function') {
        target.scrollToBottom(options)
      }
    })
  }

  return { scrollToBottom }
}
