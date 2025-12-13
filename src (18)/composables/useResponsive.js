import { inject } from "vue";

export function useResponsive() {
  const api = inject("responsive");
  if (!api) {
    throw new Error(
      "responsiveManager plugin is not installed. Call app.use(responsiveManager)."
    );
  }
  return api;
}
