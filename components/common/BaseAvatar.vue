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

<style lang="scss" scoped>
.base-avatar {
  width: var(--avatar-size);
  height: var(--avatar-size);
  border-radius: 999px;
  background: var(--color-primary-soft);
  color: var(--color-primary);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: calc(var(--control-font-size) * 0.9);
  font-weight: 600;
  overflow: hidden;
}

.base-avatar__img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.base-avatar__initials {
  text-transform: uppercase;
}
</style>
