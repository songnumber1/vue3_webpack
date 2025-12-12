<template>
  <div class="base-avatar" :style="avatarStyle">
    <img
      v-if="src"
      :src="src"
      :alt="altText"
      class="base-avatar__img"
    />
    <span v-else class="base-avatar__initials">
      {{ initials }}
    </span>
  </div>
</template>

<script>
export default {
  name: "BaseAvatar",
  props: {
    src: {
      type: String,
      default: ""
    },
    name: {
      type: String,
      default: ""
    },
    size: {
      type: Number,
      default: 0 // 0이면 CSS 토큰 사용
    }
  },
  computed: {
    initials() {
      if (!this.name) return "U";
      const parts = this.name.split(/\s+/).filter(Boolean);
      const first = parts[0] ? parts[0][0] : "";
      const second = parts[1] ? parts[1][0] : "";
      return (first + second).toUpperCase();
    },
    altText() {
      return this.name || "avatar";
    },
    avatarStyle() {
      if (!this.size) return {};
      const s = this.size + "px";
      return {
        width: s,
        height: s
      };
    }
  }
};
</script>

<style lang="scss">
@use "@/assets/styles/components/baseavatar.scss";
</style>
