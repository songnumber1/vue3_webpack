import { reactive, readonly, markRaw } from "vue";

let resolver = null;

const state = reactive({
  visible: false,
  component: null,
  props: {},
  size: "md",
});

export function openModal(component, props = {}, size = "md") {
  state.visible = true;
  state.component = markRaw(component);
  state.size = size;

  return new Promise((resolve) => {
    resolver = resolve;
    state.props = {
      ...props,
      // 모달에서 호출할 콜백 주입
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
  resolver = null;
}

export function useModalManager() {
  return {
    state: readonly(state),
    openModal,
    closeModal,
  };
}
