<template>
  <div style="width: 100%; height: 100vh; display: flex; position: relative">
    <h3
      style="position: absolute; top: 50%; left: 50%; margin: -50px 0 0 -50px"
    >
      남은 시간: {{ formattedTime }}
    </h3>
  </div>
</template>

<script>
export default {
  data() {
    return {
      startTime: Date.now(),
      remainingSeconds: 600, // 10분 = 600초
      timer: null,
      alerted5Min: false,
    };
  },
  mounted() {
    this.timer = setInterval(() => {
      const now = Date.now();
      const elapsed = Math.floor((now - this.startTime) / 1000);
      const left = 600 - elapsed;

      if (left !== this.remainingSeconds) {
        this.remainingSeconds = left;
      }

      // 5분 남았을 때 alert (1번만)
      if (left <= 300 && !this.alerted5Min) {
        alert("5분 남았습니다.");
        this.alerted5Min = true;
      }

      // 세션 만료
      if (left <= 0) {
        clearInterval(this.timer);
        alert("세션이 만료되었습니다.");
      }
    }, 1000);
  },
  beforeUnmount() {
    clearInterval(this.timer);
  },
  computed: {
    formattedTime() {
      const min = Math.floor(this.remainingSeconds / 60)
        .toString()
        .padStart(2, "0");
      const sec = (this.remainingSeconds % 60).toString().padStart(2, "0");
      return `${min}:${sec}`;
    },
  },
};
</script>
