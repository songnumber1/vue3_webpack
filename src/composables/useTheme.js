import { ref, onMounted, onBeforeUnmount, computed } from "vue";
import themeManager from "@/plugins/themeManager";

export function useTheme() {
  const theme = ref(themeManager.getTheme());
  const availableThemes = computed(() => themeManager.getAvailableThemes());
  let unsubscribe = null;

  onMounted(() => {
    unsubscribe = themeManager.subscribe((next) => {
      theme.value = next;
    });
  });

  onBeforeUnmount(() => {
    if (unsubscribe) unsubscribe();
  });

  const isDark = computed(() => theme.value === "dark");

  return {
    theme,
    isDark,
    availableThemes,
    setTheme: themeManager.setTheme,
    toggleTheme: themeManager.toggleTheme,
  };
}
