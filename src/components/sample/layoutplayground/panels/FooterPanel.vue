
<template>
  <div class="p">
    <p class="hint">Footer는 실컴포넌트가 store 없이도 동작해야 합니다. (렌더 확인)</p>
  </div>
</template>
<script>export default {};</script>
<style scoped>
.p { display:flex; flex-direction: column; gap: 12px; }
.hint { margin: 0; font-size: 12px; color: var(--muted); line-height: 1.4; }
</style>
