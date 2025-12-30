import { reactive, readonly, markRaw } from "vue";

let uid = 0;

const state = reactive({
  stack: [],
});

export function openModal(component, props = {}, options = {}) {
  return new Promise((resolve) => {
    state.stack.push({
      id: ++uid,
      component: markRaw(component),
      props,
      options,
      resolve,
    });
  });
}

export function closeTopModal(result = null) {
  const top = state.stack.pop();
  if (top) {
    top.resolve(result);
  }
}

export function useModalManager() {
  return {
    state: readonly(state),
    openModal,
    closeTopModal,
  };
}
