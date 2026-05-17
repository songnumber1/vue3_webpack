export function shouldShowScrollBottomButton({mode, listRef}) {
  return (mode === 'chat' || mode === 'shared') && Boolean(listRef && !listRef.isAtBottom?.());
}

export function createForceBottomWindow() {
  let forceBottomUntil = 0;
  return {
    mark(duration = 1800) {
      forceBottomUntil = Date.now() + duration;
    },
    reset() {
      forceBottomUntil = 0;
    },
    active() {
      return Date.now() <= forceBottomUntil;
    },
  };
}
