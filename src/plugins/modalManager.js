import { reactive, readonly, markRaw } from "vue";

const state = reactive({
  visible: false,
  component: null,
  props: {},
  size: "md",
});

export function openModal(component, props = {}, size = "md") {
  console.log("openModal called with size:", size);

  state.visible = true;
  state.component = markRaw(component);
  state.size = size;

  console.log("component type:", state.component);
  console.log("Modal state after open:", { ...state });
  return new Promise((resolve) => {
    state.props = {
      ...props,
      onConfirm: (data) => {
        resolve(data);
        closeModal();
      },
      onCancel: () => {
        resolve(null);
        closeModal();
      },
    };
  });
}

export function closeModal() {
  state.visible = false;
  state.component = null;
  state.props = {};
}

export function useModalManager() {
  return {
    state: readonly(state),
    openModal,
    closeModal,
  };
}
