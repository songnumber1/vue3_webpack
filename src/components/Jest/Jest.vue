<template>
  <div style="background-color: red">
    <p ref="tgmp"></p>
    <p>원본 메시지: "{{ message }}"</p>
    <p>역순으로 표시한 메시지: "{{ reversedMessage }}"</p>
  </div>
</template>

<script>
export default {
  name: "HelloWorld",
  props: {
    msg: String,
  },
  data: function () {
    return {
      message: "안녕하세요",
    };
  },
  watch: {
    message: function (val) {
      this.message = val;
    },
  },
  computed: {
    reversedMessage: function () {
      // `this` 는 vm 인스턴스를 가리킵니다.
      return this.message.split("").reverse().join("");
    },

    reversedMessage1: function () {
      return "1234";
    },
  },
  mounted() {
    this.voidRefsFunc();
  },
  methods: {
    voidRefsFunc() {
      this.$refs.tgmp.innerText = "1234";
    },
    returnIntRefsFunc(data) {
      this.$refs.tgmp.innerText = "1234";
      return data;
    },
    returnIntFunc(data) {
      return data;
    },
  },
};
</script>
