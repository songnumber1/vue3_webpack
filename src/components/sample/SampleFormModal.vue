<template>
  <div>
    <p>Sample Form Modal</p>

    <input v-model="name" placeholder="이름" />
    <input v-model="email" placeholder="이메일" />

    <button @click="openChild">자식 모달 열기</button>
  </div>
</template>

<script>
import { openModal } from "@/plugins/modalManager";
import ConfirmModal from "./ConfirmModal.vue";

export default {
  name: "SampleFormModal",

  data() {
    return {
      name: "",
      email: "",
    };
  },

  methods: {
    validate() {
      return true;
    },

    getPayload() {
      return {
        name: this.name,
        email: this.email,
      };
    },

    async openChild() {
      const ok = await openModal(
        ConfirmModal,
        { message: "정말 저장할까요?" },
        {
          size: "sm",
          title: "확인",
          draggable: false,
          resizable: false,
        }
      );

      if (ok) {
        alert("확인됨");
      }
    },
  },

  expose: ["validate", "getPayload"],
};
</script>
