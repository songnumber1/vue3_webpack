
<template>
  <div class="p">
    <p class="hint">
      InputHeader / 입력 컴포넌트는 실제 서비스에서 상태(store)를 직접 가져와야 합니다.
      Preview에서 렌더/버튼 반응 등을 확인하세요.
    </p>
  </div>
</template>
<script>export default {};</script>
<style scoped>
.p { display:flex; flex-direction: column; gap: 12px; }
.hint { margin: 0; font-size: 12px; color: var(--muted); line-height: 1.4; }
</style>
