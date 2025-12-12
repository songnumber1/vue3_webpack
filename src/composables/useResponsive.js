import { ref, onMounted, onBeforeUnmount, computed } from "vue";
import responsiveManager from "@/plugins/responsiveManager";

export function useResponsive() {
  const initialState = responsiveManager.getState();
  const width = ref(initialState.widthRem ?? 0);
  const height = ref(initialState.heightPx ?? 0);
  const device = ref(initialState.device ?? "desktop");
  let unsubscribe = null;

  onMounted(() => {
    unsubscribe = responsiveManager.subscribe((state) => {
      width.value = state.widthRem;
      height.value = state.heightPx;
      device.value = state.device;
    });
  });

  onBeforeUnmount(() => {
    if (unsubscribe) unsubscribe();
  });

  const isMobile = computed(() => device.value === "mobile");
  const isTablet = computed(() => device.value === "tablet");
  const isDesktop = computed(() => device.value === "desktop");

  return {
    width,
    height,
    device,
    isMobile,
    isTablet,
    isDesktop,
  };
}
