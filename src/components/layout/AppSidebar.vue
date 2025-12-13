<template>
  <aside class="sidebar" :class="{ open, collapsed: !isMobile && !open }">
    <strong class="text">DS Assistant</strong>

    <nav class="nav">
      <router-link to="/chat">💬 <span class="text">Chat</span></router-link>
      <router-link to="/playground"
        >🧪 <span class="text">Playground</span></router-link
      >
    </nav>
  </aside>
</template>

<script>
export default {
  props: {
    open: Boolean,
    isMobile: Boolean,
  },
};
</script>
