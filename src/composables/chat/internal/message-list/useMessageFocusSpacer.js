import {nextTick, ref} from "vue";

function getElementTopInScroll(container, target) {
  const containerRect = container.getBoundingClientRect();
  const targetRect = target.getBoundingClientRect();
  return container.scrollTop + targetRect.top - containerRect.top;
}

export function useMessageFocusSpacer(
  props,
  getScrollElement,
  getLatestUserMessageElement
) {
  const streamFocusSpacerHeight = ref(0);

  function recalculateFocusSpacerHeight(options = {}) {
    if (!props.loading) {
      streamFocusSpacerHeight.value = 0;
      return;
    }

    const el = getScrollElement();
    const target = getLatestUserMessageElement();
    if (!el || !target) {
      streamFocusSpacerHeight.value = 0;
      return;
    }

    const offset = Number.isFinite(options.offset) ? options.offset : 16;
    const currentSpacer = streamFocusSpacerHeight.value || 0;
    const naturalScrollHeight = Math.max(0, el.scrollHeight - currentSpacer);
    const targetTop = getElementTopInScroll(el, target);
    const requiredSpacer = Math.ceil(
      targetTop - offset + el.clientHeight - naturalScrollHeight
    );
    const maxUsefulSpacer = Math.max(0, el.clientHeight - offset);

    streamFocusSpacerHeight.value = Math.max(
      0,
      Math.min(requiredSpacer, maxUsefulSpacer)
    );
  }

  async function refreshFocusSpacerAfterRender(options = {}) {
    await nextTick();
    recalculateFocusSpacerHeight(options);
  }

  return {
    streamFocusSpacerHeight,
    recalculateFocusSpacerHeight,
    refreshFocusSpacerAfterRender,
  };
}
