export function createBottomSheetDragController({dragging, getCurrentHeight, setHeight, getViewportHeight, expand, close, minHeight, ratios}) {
  let dragStartY = 0;
  let dragStartHeight = 0;

  function startDrag(event) {
    if (!event.isPrimary && event.pointerType !== 'mouse') return;
    dragging.value = true;
    dragStartY = event.clientY;
    dragStartHeight = getCurrentHeight();
    event.currentTarget?.setPointerCapture?.(event.pointerId);
    window.addEventListener('pointermove', handleDrag, {passive: false});
    window.addEventListener('pointerup', stopDrag, {passive: true});
    window.addEventListener('pointercancel', stopDrag, {passive: true});
  }

  function handleDrag(event) {
    if (!dragging.value) return;
    event.preventDefault();
    const delta = dragStartY - event.clientY;
    setHeight(dragStartHeight + delta);
  }

  function stopDrag() {
    if (!dragging.value) return;
    dragging.value = false;
    window.removeEventListener('pointermove', handleDrag);
    window.removeEventListener('pointerup', stopDrag);
    window.removeEventListener('pointercancel', stopDrag);

    const viewportHeight = getViewportHeight();
    if (getCurrentHeight() > viewportHeight * ratios.expandThreshold) expand();
    else if (getCurrentHeight() < minHeight() * ratios.closeThreshold) close();
  }

  function cleanup() {
    window.removeEventListener('pointermove', handleDrag);
    window.removeEventListener('pointerup', stopDrag);
    window.removeEventListener('pointercancel', stopDrag);
  }

  return {startDrag, cleanup};
}
