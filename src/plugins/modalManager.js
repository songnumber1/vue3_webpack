// plugins/modalManager.js
import { reactive } from "vue";

export const modalManager = reactive({
  open: false,
  type: null,
  props: {},
  resolve: null,

  modalMap: {
    sample: {
      title: "샘플 입력",
      confirmText: "저장",
      component: "SampleFormModal",
    },
  },

  openModal(type, props = {}) {
    return new Promise((resolve) => {
      this.type = type;
      this.props = props;
      this.resolve = resolve;
      this.open = true;
    });
  },  

  close() {
    this.open = false;
    this.type = null;
    this.props = {};
    this.resolve = null;
  },

  confirm(data = true) {
    this.resolve && this.resolve(data);
    this.close();
  },
});
