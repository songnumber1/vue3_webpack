<template>
  <div>
    <p>Sample Form Modal</p>

    <input v-model="value" placeholder="값 입력" />

    <div style="margin-top: 12px">
      <button @click="onCancel">Cancel</button>
      <button @click="submit">Confirm</button>
    </div>
  </div>
</template>

<script>
export default {
  name: "SampleFormModal",

  props: {
    onConfirm: Function,
    onCancel: Function,
  },

  data() {
    return {
      value: "",
    };
  },

  methods: {
    submit() {
      this.onConfirm(this.value);
    },
  },
};
</script>
