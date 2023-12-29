<template>
  <div>
    <message :msg="msg"></message>
    <button id="toggle-message" @click="toggleMessage">Change message</button>
  </div>
</template>

<script>
import Message from "@/components/Jest/Message.vue";

export default {
  name: "message-toggle",
  data: () => ({
    msg: null,
  }),
  // mounted() {
  //   this.toggleMessage();
  // },
  methods: {
    toggleMessage() {
      this.msg = this.msg === "message" ? "toggled message" : "message";
    },
  },
  components: {
    Message,
  },
};
</script>
