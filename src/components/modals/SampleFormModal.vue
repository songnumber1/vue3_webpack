<template>
  <div>
    <label>
      이름:
      <input v-model="name" />
    </label>

    <button @click="submit" style="margin-top: 10px">내부 저장</button>
  </div>
</template>

<script>
export default {
  name: "SampleFormModal",

  // ✅ 내부 이벤트도 명시
  emits: ["submit"],

  data() {
    return {
      name: "",
    };
  },

  methods: {
    submit() {
      this.$emit("submit", { name: this.name });
    },
  },
};
</script>
