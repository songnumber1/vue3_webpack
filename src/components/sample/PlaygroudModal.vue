<template>
  <section class="card">
    <div class="card-head">
      <div class="card-title">Modal Playground</div>
      <div class="card-sub">modalManager 기반 sm / md / lg 모달 테스트</div>
    </div>

    <div class="btn-row btn-container">
      <button class="btn btn-primary" @click="open('sm')">
        Open SM
      </button>
      <button class="btn btn-primary" @click="open('md')">
        Open MD
      </button>
      <button class="btn btn-primary" @click="open('lg')">
        Open LG
      </button>
    </div>
  </section>
</template>

<script>
import { openModal } from "@/plugins/modalManager";
import SampleFormModal from "@/components/sample/SampleFormModal.vue";

export default {
  name: "PlaygroundModal",

  props: {
    bpLabel: { type: String, default: "md" },
    width: { type: Number, default: 1200 },
  },
  methods: {
    async open(size) {
      const result = await openModal(
        SampleFormModal,
        {},
        {
          size, // sm | md | lg
          draggable: size !== "sm" ? true : false,
          resizable: size !== "sm" ? true : false,
          title: "Sample Form",
        },
      );

      if (result) {
        console.log("저장됨:", result);
        // 👉 여기서 메인 화면 상태 업데이트 가능
      } else {
        console.log("취소됨");
      }
    },
  },
};
</script>
