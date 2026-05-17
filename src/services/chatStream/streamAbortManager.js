export function createStreamAbortManager() {
  let aborted = false;
  const listeners = new Set();

  function abort(reason = 'aborted') {
    if (aborted) return;
    aborted = true;
    listeners.forEach((listener) => listener(reason));
    listeners.clear();
  }

  function reset() {
    aborted = false;
    listeners.clear();
  }

  function onAbort(listener) {
    if (aborted) {
      listener('aborted');
      return () => {};
    }
    listeners.add(listener);
    return () => listeners.delete(listener);
  }

  function isAborted() {
    return aborted;
  }

  return {abort, reset, onAbort, isAborted};
}
