
<template>
  <div class="wrap" :class="{ focused }">
    <input class="i" :style="{ height: 'var(--pv-input-h)' }" placeholder="Preview input..." />
    <button class="btn">Send</button>
  </div>
</template>

<script>
export default { props: { focused: Boolean } };
</script>

<style scoped>
.wrap {
  display:flex; gap: 8px; align-items:center;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 10px;
}
.wrap.focused { outline: 2px solid var(--primary); outline-offset: -2px; }
.i {
  flex: 1;
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 0 12px;
  background: transparent;
  color: var(--text);
}
.btn {
  height: var(--pv-input-h);
  padding: 0 14px;
  border-radius: 12px;
  border: 0;
  background: var(--primary);
  color: white;
  cursor: pointer;
}
</style>
