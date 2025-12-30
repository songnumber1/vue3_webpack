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
    validate() {
      return true;
    },

    getPayload() {
      return {
        value: this.value,
      };
    },
  },

  expose: ["validate", "getPayload"],
};
</script>
