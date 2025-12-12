import { ref, onMounted, onBeforeUnmount, computed } from "vue";
import responsiveManager from "@/plugins/responsiveManager";

export function useResponsive() {
  const width = ref(window.innerWidth);
  const height = ref(window.innerHeight);
  const device = ref("desktop");
  let unsubscribe = null;

  onMounted(() => {
    unsubscribe = responsiveManager.subscribe(state => {
      width.value = state.width;
      height.value = state.height;
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
    isDesktop
  };
}
