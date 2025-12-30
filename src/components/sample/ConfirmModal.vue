<template>
  <div>
    <p>{{ message }}</p>
  </div>
</template>

<script>
export default {
  name: "ConfirmModal",
  props: {
    message: String,
  },

  methods: {
    getPayload() {
      return true;
    },
  },

  expose: ["getPayload"],
};
</script>
