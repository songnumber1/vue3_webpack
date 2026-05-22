import {computed, onBeforeUnmount, watch} from "vue";
import {useOverlayStore} from "@/stores/overlayStore";

let overlaySequence = 0;

function createOverlayId(kind) {
  overlaySequence += 1;
  return `${kind || "overlay"}-${overlaySequence}`;
}

/**
 * Registers an overlay while it is open and unregisters it on close/unmount.
 * This keeps body overlay metadata consistent without taking ownership of each
 * component's existing open state.
 */
export function useOverlayRegistration({open, kind, mode}) {
  const overlayStore = useOverlayStore();
  const id = createOverlayId(kind);
  const overlayMode = computed(() => {
    if (typeof mode === "function") return mode() || "default";
    return mode?.value || mode || "default";
  });

  watch(
    () => Boolean(open?.value),
    (isOpen) => {
      if (isOpen) {
        overlayStore.registerOverlay({id, kind, mode: overlayMode.value});
      } else {
        overlayStore.unregisterOverlay(id);
      }
    },
    {immediate: true}
  );

  watch(overlayMode, (nextMode) => {
    if (!open?.value) return;
    overlayStore.registerOverlay({id, kind, mode: nextMode});
  });

  onBeforeUnmount(() => {
    overlayStore.unregisterOverlay(id);
  });

  return {overlayId: id};
}
