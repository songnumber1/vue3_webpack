import { reactive, readonly, markRaw } from "vue";

const state = reactive({
  visible: false,
  component: null,
  props: {},
  options: {
    size: "md",
    draggable: true,
    resizable: true,
    title: "Modal",
  },
});

export function openModal(component, props = {}, options = {}) {
  state.visible = true;
  state.component = markRaw(component);

  state.options = {
    size: options.size || "md",
    draggable: options.draggable ?? true,
    resizable: options.resizable ?? true,
    title: options.title || "Modal",
  };

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
