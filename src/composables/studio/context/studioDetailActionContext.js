/**
 * @file composables/studio/context/studioDetailActionContext.js
 * @description Studio 상세 보기의 close/edit/delete action을 화면별 중간 emit 없이 연결하기 위한 context입니다.
 */
import {inject, provide} from "vue";

export const STUDIO_DETAIL_ACTION_CONTEXT_KEY = Symbol(
  "STUDIO_DETAIL_ACTION_CONTEXT"
);

export function createEmptyStudioDetailActions() {
  return {
    open: null,
    close: null,
    edit: null,
    delete: null,
  };
}

export function provideStudioDetailActions(actions = {}) {
  provide(STUDIO_DETAIL_ACTION_CONTEXT_KEY, {
    ...createEmptyStudioDetailActions(),
    ...actions,
  });
}

export function useStudioDetailActions() {
  return inject(
    STUDIO_DETAIL_ACTION_CONTEXT_KEY,
    createEmptyStudioDetailActions()
  );
}
