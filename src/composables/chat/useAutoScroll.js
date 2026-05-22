import {nextTick} from "vue";

function afterFrame(callback) {
  if (
    typeof window === "undefined" ||
    typeof window.requestAnimationFrame !== "function"
  ) {
    setTimeout(callback, 0);
    return;
  }

  window.requestAnimationFrame(() => {
    window.requestAnimationFrame(callback);
  });
}
export function useAutoScroll(targetRef) {
  async function scrollToBottom(options = {}) {
    await nextTick();

    afterFrame(() => {
      const target = targetRef.value;
      if (!target) return;

      if (typeof target.scrollToBottom === "function") {
        target.scrollToBottom(options);
      }
    });
  }

  return {scrollToBottom};
}
