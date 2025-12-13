<template>
  <aside class="sidebar" :class="{ open, mobile: isMobile }">
    <div class="top">
      <div class="brand">
        <div class="logo">◎</div>
        <div class="txt">
          <div class="t1">DS Assistant</div>
          <div class="t2 muted">Sidebar</div>
        </div>
      </div>

      <button
        v-if="isMobile"
        class="btn btn-ghost btn-sm"
        @click="$emit('close')"
      >
        닫기
      </button>
    </div>

    <nav class="nav">
      <a class="nav-item active" href="#">
        <span class="dot"></span> New chat
      </a>
      <a class="nav-item" href="#"> <span class="dot"></span> History </a>
      <a class="nav-item" href="#"> <span class="dot"></span> Playground </a>
      <div class="hr"></div>
      <a class="nav-item" href="#"> <span class="dot"></span> Settings </a>
    </nav>

    <div class="bottom">
      <div class="profile">
        <div class="avatar">MW</div>
        <div class="meta">
          <div class="who">민우 송</div>
          <div class="muted small">Option API · Webpack</div>
        </div>
      </div>
    </div>
  </aside>
</template>

<script>
export default {
  name: "AppSidebar",
  props: {
    open: { type: Boolean, default: false },
    isMobile: { type: Boolean, default: false },
  },
};
</script>

<style scoped lang="scss">
.sidebar {
  width: 280px;
  min-width: 280px;
  background: var(--panel);
  border-right: 1px solid var(--line);
  padding: var(--gap-2);
  display: flex;
  flex-direction: column;
  gap: var(--gap-2);
  position: sticky;
  top: 0;
  height: 100vh;
  z-index: 50;
}

.sidebar.mobile {
  position: fixed;
  left: 0;
  top: 0;
  transform: translateX(-102%);
  transition: transform 0.2s ease;
  box-shadow: var(--shadow-md);
}
.sidebar.mobile.open {
  transform: translateX(0);
}

.top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--gap-1);
}
.brand {
  display: flex;
  align-items: center;
  gap: var(--gap-1);
  min-width: 0;
}
.logo {
  width: 38px;
  height: 38px;
  border-radius: 12px;
  display: grid;
  place-items: center;
  background: color-mix(in oklab, var(--accent), var(--panel) 70%);
  border: 1px solid color-mix(in oklab, var(--accent), var(--line) 40%);
}
.txt {
  min-width: 0;
}
.t1 {
  font-weight: 800;
}
.t2 {
  font-size: var(--font-sm);
}

.nav {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: calc(10px * var(--ui-scale)) calc(12px * var(--ui-scale));
  border-radius: 12px;
  border: 1px solid transparent;
  color: var(--text);
}
.nav-item:hover {
  background: var(--panel-2);
  border-color: var(--line);
}
.nav-item.active {
  background: var(--panel-2);
  border-color: color-mix(in oklab, var(--accent), var(--line) 50%);
}
.dot {
  width: 10px;
  height: 10px;
  border-radius: 999px;
  background: color-mix(in oklab, var(--accent), var(--panel) 40%);
  border: 1px solid color-mix(in oklab, var(--accent), var(--line) 40%);
}
.hr {
  height: 1px;
  background: var(--line);
  margin: 6px 0;
}

.bottom {
  margin-top: auto;
}
.profile {
  display: flex;
  gap: var(--gap-1);
  align-items: center;
  padding: var(--gap-1);
  border: 1px solid var(--line);
  border-radius: 14px;
  background: color-mix(in oklab, var(--panel), var(--panel-2) 24%);
}
.avatar {
  width: 40px;
  height: 40px;
  border-radius: 999px;
  display: grid;
  place-items: center;
  background: var(--panel-2);
  border: 1px solid var(--line);
  font-weight: 800;
}
.small {
  font-size: var(--font-sm);
}
</style>
