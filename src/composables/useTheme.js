import { inject } from "vue";

export function useTheme() {
  const api = inject("theme");
  if (!api) {
    throw new Error(
      "themeManager plugin is not installed. Call app.use(themeManager)."
    );
  }
  return api;
}
