<template>
  <div>
    <p>Sample Form Modal</p>
    <input v-model="value" placeholder="값 입력" />
  </div>
</template>

<script>
export default {
  name: "SampleFormModal",

  data() {
    return {
      value: "",
    };
  },

  methods: {
    getValue() {
      return this.value;
    },
  },

  // 🔑 Vue 3에서 setup 외부 접근 허용
  expose: ["getValue"],
};
</script>
