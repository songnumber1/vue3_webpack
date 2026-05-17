export function getVisualViewport() {
  return typeof window === 'undefined' ? null : window.visualViewport || null;
}

export function getKeyboardViewportOffset() {
  const visualViewport = getVisualViewport();
  if (!visualViewport || typeof window === 'undefined') return 0;
  const layoutHeight = window.innerHeight || visualViewport.height;
  const offset = layoutHeight - visualViewport.height - visualViewport.offsetTop;
  return Math.max(0, Math.round(offset));
}

export function subscribeKeyboardViewport(listener) {
  const visualViewport = getVisualViewport();
  if (!visualViewport || typeof window === 'undefined') return () => {};
  const handleChange = () => listener({keyboardOffset: getKeyboardViewportOffset()});
  visualViewport.addEventListener('resize', handleChange, {passive: true});
  visualViewport.addEventListener('scroll', handleChange, {passive: true});
  return () => {
    visualViewport.removeEventListener('resize', handleChange);
    visualViewport.removeEventListener('scroll', handleChange);
  };
}
