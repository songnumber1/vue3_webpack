export function createTimeoutBag() {
  const timerIds = [];
  return {
    add(timerId) {
      if (timerId) timerIds.push(timerId);
      return timerId;
    },
    clear() {
      timerIds.forEach((timerId) => window.clearTimeout(timerId));
      timerIds.length = 0;
    },
  };
}
