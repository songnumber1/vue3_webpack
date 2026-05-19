import {inject} from "vue";

export function useAppContext() {
  const context = inject("appContext");
  if (!context) throw new Error("appContext is not provided.");

  return context;
}
