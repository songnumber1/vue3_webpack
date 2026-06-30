import {inject, provide} from "vue";

export const STUDIO_LIST_CONTEXT_KEY = Symbol("studioListContext");

export function provideStudioList(context) {
  provide(STUDIO_LIST_CONTEXT_KEY, context || null);
}

export function useStudioList() {
  const context = inject(STUDIO_LIST_CONTEXT_KEY, null);
  if (!context) {
    throw new Error("useStudioList must be used within provideStudioList().");
  }
  return context;
}
