export function createBodyScrollLock() {
  let previousBodyOverflow = '';

  function lock() {
    if (typeof document === 'undefined') return;
    previousBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
  }

  function unlock() {
    if (typeof document === 'undefined') return;
    document.body.style.overflow = previousBodyOverflow;
  }

  return {lock, unlock};
}
